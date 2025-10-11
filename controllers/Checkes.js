import CheckType from '../models/checkModel.js';
import { Op } from 'sequelize';
import ItemCheck from '../models/itemsCheckModel.js';
import ItemBatch from '../models/itemsBatchModel.js';
import Accounting from '../models/accountingModel.js';
import { Accounts } from '../models/settingsModel.js';
 
export const getAllCheckes = async (req, res) => {
    try {
        const whereConditions = {};
        const checkIds = [];
        const user = req.user;
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

       
        if ((user.role === 'SLR' && req.body.isPaid) || (user.role === 'KUR' && req.body.isPaid)) {
            whereConditions.createdAt = {
                [Op.gt]: twoWeeksAgo 
            };
        }
        if (req.body.customer) {
            whereConditions.customer = {
                    [Op.like]: `%${req.body.customer}%`
                };
        }
        if (req.body.dateMin) {
                whereConditions.createdAt = {
                    [Op.gt]: req.body.dateMin
                };
            }
        if (req.body.dateMax) {
                whereConditions.createdAt = {
                    [Op.lt]: req.body.dateMax
                };
            }
        const conditions = [];

        if (req.body.isPaid) {
            conditions.push({
                isBooking: false,
                isUnpaid: false
            });
            conditions.push({
                isBooking: null,
                isUnpaid: null
            });
        }
        if (req.body.isUnpaid) {
            conditions.push({
                isUnpaid: true
            });
        }
        if (req.body.isBooking) {
            conditions.push({
                isBooking: true
            });
        }

        // Объединяем условия с помощью OR
        if (conditions.length > 0) {
            whereConditions[Op.or] = conditions;
        }
        
        
        if (req.body.name) {
                const itemsCheckRecords = await ItemCheck.findAll({
                    where: { name: req.body.name },
                });
    
                if (itemsCheckRecords.length > 0) {
                    checkIds.push(...itemsCheckRecords.map(record => record.checkId));
                }
        }
    
        if (checkIds.length > 0) {
                whereConditions.checkId = {
                    [Op.in]: checkIds 
                };
        }
       
        const orderBy = [];
        if (req.query.sort) {
            const sortParams = req.query.sort.split('&');
            sortParams.forEach(param => {
                const [fieldname, order] = param.split(',');
                if (fieldname && order) {
                    orderBy.push([fieldname, order]);
                }
            });
        }
        const page = parseInt(req.query.page) || 0; // Номер страницы (по умолчанию 0)
        const size = parseInt(req.query.size) || 10; // Размер страницы (по умолчанию 10)
        
        const { count, rows } = await CheckType.findAndCountAll({
            where: whereConditions,
            order: orderBy.length ? orderBy : null,
            limit: size,
            offset: page * size,
        });

        
        // Формируем ответ в формате TPageableResponse
        const response = {
            content: rows,
            pageable: {
                sort: orderBy.length ? orderBy : null,
                pageNumber: page,
                pageSize: size,
                paged: true,
                unpaged: false,
            },
            dataHide: false,
            empty: rows.length === 0,
            first: page === 0,
            last: page >= Math.ceil(count / size) - 1,
            number: page,
            numberOfElements: rows.length,
            size: size,
            sort: orderBy.length ? orderBy : null,
            totalElements: count,
            totalPages: Math.ceil(count / size),
        };
    res.json(response);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 


export const getCheckById = async (req, res) => {
    try {
        const check = await CheckType.findAll({
            where: {
                checkId: req.params.checkId
            }
        });
        res.json(check[0]);
    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const getProductBySerialNumber = async (req, res) => {
    try {
        const product = await ItemBatch.findAll({
            where: {
                serialNumber: req.params.serialNumber
            }
        });
        res.json(product[0]);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const createCheck = async (req, res) => {
    try {
        
        const errors = [];
        const itemIds = new Set();

        req.body.body.forEach((item, index) => {
            // Проверка на пустое значение itemId
            if (!item.itemId) {
                errors.push({ state: 'itemId', caption: `Выберите товар`, index: index });
            }
            // Проверка на дублирование serialNumber
            if (itemIds.has(item.serialNumber)) {
                errors.push({ state: 'serialNumber', caption: `Серийный номер дублируется`, index: index });
            } else {
                if (item.serialNumber) {
                    itemIds.add(item.serialNumber);
                }
            }
        });

        // Итерируемся по элементам из тела запроса
        const itemsCheck = req.body.body;

        // Обрабатываем каждый элемент
        const promises = itemsCheck.filter(elem => !elem.serialNumber).map(async (item) => {
            const totalQuantFinal = await ItemBatch.sum('remainder', {
                where: {
                    itemId: item.itemId,
                },}); 
                if (totalQuantFinal < item.quant) {
                    errors.push({ state: 'quant', caption: `Недостаточно кол-ва на складе`, index: itemsCheck.indexOf(item) });
                }  
            
        });

        await Promise.all(promises);

        // Если есть ошибки, возвращаем их
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors });
        }        

        const createdCheck = await CheckType.create(req.body)
        
        // Итерируемся по элементам из тела запроса
        const partners = req.body.partners;
        if ((req.body.partners?.length > 0) && !req.body.isBooking && !req.body.isUnpaid) {
            // Обрабатываем каждый элемент
        const partnerPromises = partners.map(async (item) => {
            const accounting = {
                accountFrom: item.partner,
                accountTo: null,
                value: item.summPartner,
                category: 'Продажа товара контрагента',
                form: null,
                justification: createdCheck.checkId,
            }
            await Accounting.create(accounting)
            
            const account = await Accounts.findOne({
                where: {
                    name: accounting.accountFrom
                }
            });
    
            await Accounts.update({
                value: Number(account.value) - Number(item.summPartner)
            },{
                where: { name: accounting.accountFrom}
            });

        });

        await Promise.all(partnerPromises);
        }

        if ( !req.body.isBooking && !req.body.isUnpaid) {
            const existingAccounting = await Accounting.findOne({
                where: {
                    justification: createdCheck.checkId,
                    category: 'Продажа товара'
                }
            });

            if (!existingAccounting) {
                const accountingOffice = {
                    accountFrom: null,
                    accountTo: req.body.account,
                    value: req.body.summ,
                    category: 'Продажа товара',
                    form: null,
                    justification: createdCheck.checkId,
                }
                await Accounting.create(accountingOffice);
                const accountOffice = await Accounts.findOne({
                                where: {
                                   name: req.body.account
                                }
                            });
        
                await Accounts.update({
                    value: Number(accountOffice.value) + Number(req.body.summ)
                },{
                    where: { name: req.body.account}
                });

            }
        }


        res.json({
            createdCheck
        });

    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const updateCheck = async (req, res) => {
    try {
        const check = req.body;
        const updatedCheck = await CheckType.update(check, {where: {
            checkId: req.params.checkId
        }})

        if (req.body.isEnding && (req.body.partners?.length > 0)) {
            // Обрабатываем каждый элемент
        const partnerPromises = req.body.partners.map(async (item) => {
            const accounting = {
                accountFrom: item.partner,
                accountTo: null,
                value: item.summPartner,
                category: 'Продажа товара контрагента',
                form: null,
                justification: req.params.checkId,
            }
            await Accounting.create(accounting)
            const account = await Accounts.findOne({
                where: {
                    name: accounting.accountFrom
                }
            });
    
            await Accounts.update({
                value: Number(account.value) - Number(item.summPartner)
            },{
                where: { name: accounting.accountFrom}
            });
        });

        await Promise.all(partnerPromises);
        }

        if (req.body.isEnding) {
        const accountingOfice = {
            accountFrom: null,
                accountTo: req.body.account,
                value: req.body.summ,
                category: 'Продажа товара',
                form: null,
                justification: req.params.checkId.toString(),
        }
        await Accounting.create(accountingOfice)
        const accountOffice = await Accounts.findOne({
            where: {
               name: req.body.account
            }
        });
        await Accounts.update({
        value: Number(accountOffice.value) + Number(req.body.summ)
        },{
        where: { name: req.body.account}
        });
        }
        res.json({
            updatedCheck
        });

    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const deleteCheck = async (req, res) => {
    try {
        const check =  await CheckType.findOne({
            where: {
                checkId: req.params.checkId
            }
        });
        await CheckType.destroy({
            where: {
                checkId: req.params.checkId
            }
        });

        // const accountOffice = await Accounts.findOne({
        //     where: {
        //         name: 'Деньги в офисе'
        //     }
        // })
        

        // const accountingFrom = await Accounting.findOne({
        //     where: {
        //         accountTo: null,
        //         justification: req.params.checkId
        //     }
        // });
        // const accountingTo = await Accounting.findOne({
        //     where: {
        //         accountFrom: null,
        //         justification: req.params.checkId
        //     }
        // });

        // const accountFrom = await Accounts.findOne({
        //     where: {
        //         name: accountingFrom.accountFrom
        //     }
        // })

        // if (accountingTo) {
        //     await Accounts.update({
        //         value: Number(accountOffice.value) - Number(check.summ)
        //     }, 
        //     { where: {
        //         name: req.body.account
        //     }
        //     })
        //     await Accounting.destroy({
        //         where: {
        //             justification: req.params.checkId
        //         }
        //     });
        // }
        // if (accountingFrom) {
            

        //     await Accounts.update({
        //         value: Number(accountFrom.value) + Number(check.summ)
        //     }, 
        //     { where: {
        //         name: accountingFrom.accountFrom
        //     }
        //     })

        //     await Accounting.destroy({
        //         where: {
        //             justification: req.params.checkId
        //         }
        //     });
        // }

        


        res.json({
            "message": "Check Deleted"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}


export const getSalesDebt = async (req, res) => {
  try {
    const records = await CheckType.findAll({
      attributes: ['summ', 'isUnpaid', 'isBooking']
    });

    // Если нет записей — вернуть нули
    if (!records || records.length === 0) {
      return res.json({ isUnpaid: 0, isBooked: 0 });
    }

    // Суммируем
    let isUnpaid = 0;
    let isBooked = 0;

    for (const r of records) {
      const summ = Number(r.get ? r.get('summ') : r.summ) || 0;
      if (r.get ? r.get('isUnpaid') : r.isUnpaid) isUnpaid += summ;
      if (r.get ? r.get('isBooking') : r.isBooked) isBooked += summ;
    }

    return res.json({ isUnpaid, isBooked });
  } catch (error) {
    return res.json({ message: error.message });
  }
};