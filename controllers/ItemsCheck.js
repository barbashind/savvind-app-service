import Accounting from "../models/accountingModel.js";
import CheckType from "../models/checkModel.js";
import ItemBatch from "../models/itemsBatchModel.js";
import ItemCheck from "../models/itemsCheckModel.js";
import { Op } from 'sequelize';
import { Accounts } from "../models/settingsModel.js";

export const getRevenueAndProfit = async (req, res) => {
    try {
        const { users, startDate, endDate } = req.body;
        const results = [];

        for (const user of users) {
            // Ищем все saleId для текущего пользователя
            const sales = await CheckType.findAll({
                where: {
                    seller: user,
                    createdAt: {
                        [Op.gte]: startDate,
                        [Op.lt]: endDate
                    }
                }
            });

            const saleIds = sales.map(sale => sale.checkId);

            if (saleIds.length > 0) {
                // Ищем записи в таблице receipts по найденным saleId
                const receipts = await ItemCheck.findAll({
                    where: {
                        checkId: {
                            [Op.in]: saleIds
                        }
                    }
                });

                // Рассчитываем revenue и margProfit
                const revenue = Number(receipts.reduce((acc, receipt) => acc + parseFloat(receipt.salePrice), 0).toFixed(2));
                const cost = Number(receipts.reduce((acc, receipt) => acc + parseFloat(receipt.costPrice), 0).toFixed(2));
                const margProfit = Number((revenue - cost).toFixed(2)) ? Number((revenue - cost).toFixed(2)) : 0;

                results.push({ user, revenue, margProfit });
            } else {
                // Если нет продаж, добавляем пользователя с нулевыми значениями
                results.push({ user, revenue: 0, margProfit: 0 });
            }
        }

        res.json(results);
    } catch (error) {
        res.json({ message: error.message });
    }
}
import moment from 'moment'; // Убедитесь, что вы установили moment.js для работы с датами
import Batch from "../models/batchModel.js";
import Deliver from "../models/deliversModel.js";

export const getRevenueAndProfitGraph = async (req, res) => {
    try {
        const { users, startDate, endDate } = req.body;
        const results = [];

        // Преобразуем строки дат в объекты Moment
        const start = moment(startDate);
        const end = moment(endDate);

        // Проходим по всем датам в диапазоне
        for (let date = start.clone(); date.isBefore(end); date.add(1, 'days')) {
            const currentDate = date.format('YYYY-MM-DD'); // Форматируем дату

            for (const user of users) {
                // Ищем все saleId для текущего пользователя за текущую дату
                const sales = await CheckType.findAll({
                    where: {
                        seller: user,
                        createdAt: {
                            [Op.gte]: moment(currentDate).startOf('day').toDate(),
                            [Op.lt]: moment(currentDate).endOf('day').toDate()
                        }
                    }
                });

                const saleIds = sales.map(sale => sale.checkId);

                if (saleIds.length > 0) {
                    // Ищем записи в таблице receipts по найденным saleId
                    const receipts = await ItemCheck.findAll({
                        where: {
                            checkId: {
                                [Op.in]: saleIds
                            }
                        }
                    });

                    // Рассчитываем revenue и margProfit
                    const revenue = Number(receipts.reduce((acc, receipt) => acc + parseFloat(receipt.salePrice), 0).toFixed(2));
                    const cost = Number(receipts.reduce((acc, receipt) => acc + parseFloat(receipt.costPrice), 0).toFixed(2));
                    const margProfit = Number((revenue - cost).toFixed(2)) ? Number((revenue - cost).toFixed(2)) : 0;

                    results.push({ user, date: currentDate, revenue, margProfit });
                } else {
                    // Если нет продаж, добавляем пользователя с нулевыми значениями
                    results.push({ user, date: currentDate, revenue: 0, margProfit: 0 });
                }
            }
        }

        res.json(results);
    } catch (error) {
        res.json({ message: error.message });
    }
}

export const getAnalyticProd = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const start = moment(startDate);
        const end = moment(endDate);

        // Получаем все записи за период
        const sales = await ItemCheck.findAll({
            where: {
                createdAt: {
                    [Op.gte]: start.toDate(),
                    [Op.lt]: end.toDate()
                }
            }
        });

        // Сгруппируем данные по name
        const grouped = sales.reduce((acc, item) => {
            const name = item.name;

            if (!acc[name]) {
                acc[name] = {
                    name,
                    quantAll: 0,
                    quantMy: 0,
                    quantPartner: 0,
                    revenueAll: 0,
                    revenueMy: 0,
                    revenuePartner: 0,
                    margAll: 0,
                    margMy: 0,
                    margPartner: 0
                };
            }

            const partnerIsNull = item.partner === null || item.partner === undefined;
            const margin = Number(item.salePrice) - Number(item.costPrice);

            acc[name].quantAll += 1;
            acc[name].revenueAll += Number(item.salePrice);
            acc[name].margAll += Number(margin);

            if (partnerIsNull) {
                acc[name].quantMy += 1;
                acc[name].revenueMy += Number(item.salePrice);
                acc[name].margMy += Number(margin);
            } else {
                acc[name].quantPartner += 1;
                acc[name].revenuePartner += Number(item.salePrice);
                acc[name].margPartner += Number(margin);
            }

            return acc;
        }, {});

        // Преобразуем в массив
        let results = Object.values(grouped);

        // Обработка сортировки
        if (req.query.sort) {
            const sortParams = req.query.sort.split('&');
            sortParams.forEach(param => {
                const [field, order] = param.split(',');
                if (field && order) {
                    results.sort((a, b) => {
                        if (!(field in a) || !(field in b)) return 0;
                        if (order.toLowerCase() === 'desc') return b[field] > a[field] ? 1 : -1;
                        return a[field] > b[field] ? 1 : -1;
                    });
                }
            });
        }

        // Пагинация
        const page = Math.max(0, parseInt(req.query.page) || 0);
        const size = Math.max(1, parseInt(req.query.size) || 10);

        const pagedResults = results.slice(page * size, page * size + size);

        // Формируем ответ в формате TPageableResponse
        const response = {
            content: pagedResults,
            pageable: {
                sort: req.query.sort || null,
                pageNumber: page,
                pageSize: size,
                paged: true,
                unpaged: false,
            },
            dataHide: false,
            empty: pagedResults.length === 0,
            first: page === 0,
            last: page >= Math.ceil(results.length / size) - 1,
            number: page,
            numberOfElements: pagedResults.length,
            size: size,
            sort: req.query.sort || null,
            totalElements: results.length,
            totalPages: Math.ceil(results.length / size),
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

export const getAssets = async (req, res) => {
    try {

        const { startDate, endDate } = req.body;
        const start = moment(startDate);
        const end = moment(endDate);

        // Найти записи в таблице batches с status "CREATED" или "REGISTRATION"
        const createdOrRegistrationBatches = await Batch.findAll({
            where: {
                batchStatus: { [Op.in]: ["CREATED", "REGISTRATION"] }
            }
        });

        // Суммировать costPriceAll из items_batch для найденных batches
        let totalCostPriceSup = 0;

        for (const sup of createdOrRegistrationBatches) {
            const items = await ItemBatch.findAll({ where: { batchId: sup.batchId } });
            
            items.forEach(item => {
                
                totalCostPriceSup += Number(item.quant) * Number(item.costPriceAll);
                
            });
        }

        const supplies = Number(totalCostPriceSup);

        // Найти записи в таблице batches с status "COMPLETED"
        const completedBatches = await Batch.findAll({
            where: { batchStatus: "COMPLETED" }
        });
        
        let totalCostPriceWithSerial = 0;
        let totalCostPriceWithoutSerial = 0;

        for (const batch of completedBatches) {
            const items = await ItemBatch.findAll({ where: { batchId: batch.batchId } });
            
            items.forEach(item => {
                if (item.hasSerialNumber) {
                    if (item.serialNumber && !item.isSaled) {
                        totalCostPriceWithSerial += Number(item.costPriceAll);
                    }
                } else {
                    totalCostPriceWithoutSerial += Number(item.remainder) * Number(item.costPriceAll);
                }
            });
        }

        const warehouse = Number(totalCostPriceWithSerial) + Number(totalCostPriceWithoutSerial);

        // Получить все записи в таблице accounts кроме "Деньги в офисе"
        const accounts = await Accounts.findAll({
            where: { name: { [Op.ne]: "Деньги в офисе" } }
        });

        const debit = accounts.reduce((sum, account) => sum + Number(account.value), 0);

        // Запись "Деньги в офисе"
        const officeAccount = await Accounts.findOne({ where: { name: "Деньги в офисе" } });
        const officeAsset = officeAccount ? officeAccount.value : 0;

        // Суммировать все значения поля salePrice в таблице sales
        const revenueResult = await ItemCheck.sum('salePrice', {
            where: {
                createdAt: {
                    [Op.between]: [start.toDate(), end.toDate()]
                }
            }
        });
        const revenue = revenueResult || 0;

        // Суммировать все значения поля costPrice в таблице sales
         const costResult = await ItemCheck.sum('costPrice', {
            where: {
                createdAt: {
                    [Op.between]: [start.toDate(), end.toDate()]
                }
            }
        });
        const cost = costResult || 0;

        // Вычислить маржинальную прибыль
        const margProfit = revenue - cost;

        // Выдать объект с результатами
        res.json({
            supplies: supplies,
            warehouse: warehouse,
            debit: debit,
            officeAsset: officeAsset,
            revenue: revenue,
            margProfit: margProfit
        });
    } catch (error) {
        res.json({ message: error.message });
    }
}

export const getDeliversAnalytics = async (req, res) => {
    try {
                const batches = await Batch.findAll({
                    where: {
                        batchStatus: 'CREATED' 
                    }
                });

                const deliversIds = [...new Set(batches.map(item => item.deliver))];
                const delivers = []

                for (const deliverId of deliversIds) {
                    const deliverName = await Deliver.findOne({ where: { deliverId: deliverId } });
                    
                    const productsMap = {};
                    const deliverBatches = batches.filter(el => el.deliver === deliverId);
                    
                    for (const deliverBatch of deliverBatches) {
                        const productsBatch = await ItemBatch.findAll({ where: { batchId: deliverBatch.batchId } });
                        for (const elem of productsBatch) {
                            if (productsMap[elem.name]) {
                                productsMap[elem.name] += elem.quant; 
                            } else {
                                productsMap[elem.name] = elem.quant;
                            }
                        }
                    }
                    const products = Object.entries(productsMap).map(([name, quant]) => ({ name, quant }));
                    
                    delivers.push({ deliver: deliverName.name, products: products });
                }

                res.json(delivers);
        
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        };


export const getAllItemsCheck = async (req, res) => {
    try {
        const whereConditions = {};
        const checkIds = [];
        const user = req.user;
        if (user.role !== 'ADM') {
            const CheckRecords = await CheckType.findAll({
                where: { seller: user.username },
            });
            if (CheckRecords.length > 0) {
                checkIds.push(...CheckRecords.map(record => record.checkId));
            }
        }
        
        if (checkIds.length > 0) {
            whereConditions.checkId = {
                [Op.in]: checkIds 
            };
        }

        if (req.body.searchText) {
            whereConditions.name = {
                    [Op.like]: `%${req.body.searchText}%`
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
            
            const { count, rows } = await ItemCheck.findAndCountAll({
                where: whereConditions,
                order: orderBy.length ? orderBy : null,
                limit: size,
                offset: page * size,
            });

            if (user.role === 'KUR') {
                res.json({message: 'Нет полномочий'}); // Фильтрация по полю seller, если роль не ADM
            } else {
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
            }
            
    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const getItemsCheckToReturn = async (req, res) => {
    try {
        const whereConditions = {};
        if (req.body.searchText) {
            whereConditions.name = {
                    [Op.like]: `%${req.body.searchText}%`
                };
        }
        if (req.body.customer) {
            whereConditions.customer = {
                    [Op.like]: `%${req.body.customer}%`
                };
        }
        if (req.body.dateMin) {
                whereConditions.createdAt = {
                    [Op.gte]: req.body.dateMin
                };
            }
        if (req.body.dateMax) {
                whereConditions.createdAt = {
                    [Op.lt]: req.body.dateMax
                };
            }

            const response = await ItemCheck.findAll({
                where: whereConditions,
            });

        res.json(response);
    } catch (error) {
        res.json({ message: error.message });
    }  
}



export const getItemsCheckById = async (req, res) => {
    const user = req.user;
    try {
        const item = await ItemCheck.findAll({
            where: {
                checkId: req.params.checkId
            }
        });
        if (user.role === 'KUR') {
            const itemKur = item.map(elem => ({...elem.toJSON(), costPrice: 0}))
            res.json(itemKur);
        } else {
            res.json(item);
        }

        
    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const getItemsCheckBySerial = async (req, res) => {
    try {
        const item = await ItemCheck.findAll({
            where: {
                serialNumber: req.params.serialNumber
            }
        });
        res.json(item[0]);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const createItemsCheck = async (req, res) => {
    try {
        // Логируем исходные данные
        console.log('Received body:', req);
        const updatedItemsBatch = [];
        for (const item of req.body) {
            if (item.serialNumber) {
                // 1. Если есть serialNumber, обновляем соответствующую запись в itemsBatch
                const batchItem = await ItemBatch.findOne({ where: { serialNumber: item.serialNumber } });

                if (batchItem) {
                    // Обновляем isSaled и устанавливаем costPrice из найденной записи
                    await ItemBatch.update({
                        isSaled: true,
                    }, {
                        where: { itemBatchId: batchItem.itemBatchId } // Указываем условие для обновления
                    }
                     );
                    item.costPrice = batchItem.costPriceAll; // Заполняем costPrice из найденной записи
                } else {
                    console.warn(`No itemsBatch found for serialNumber: ${item.serialNumber}`);
                }

            } else {
                // 2. Если нет serialNumber, находим запись с наименьшей датой createdAt
                const batchItem = await ItemBatch.findOne({
                    where: {
                        itemId: item.itemId,
                        remainder: { [Op.gt]: 0 } // Ищем только записи с remainder больше 0
                    },
                    order: [['itemBatchId', 'ASC']], // Сортируем по дате
                });

                if (batchItem) {
                    // Уменьшаем remainder на 1
                    await ItemBatch.update({
                        remainder: batchItem.remainder - 1,
                    }, {
                        where: { itemBatchId: batchItem.itemBatchId } // Указываем условие для обновления
                    });
                    // Заполняем costPrice из найденной записи
                    item.costPrice = batchItem.costPriceAll;
                    item.batchId = batchItem.batchId
                } else {
                    console.warn(`No available itemsBatch found for itemId: ${item.itemId} with remainder > 0`);
                }
            }

            // Добавляем обновленную запись в массив
            updatedItemsBatch.push(item);
        }


        // Создаем элементы партии
        const itemsCheck = await ItemCheck.bulkCreate(updatedItemsBatch);

        // Если нет созданных элементов, возвращаем соответствующее сообщение
        if (itemsCheck.length === 0) {
            return res.status(500).json({ message: 'No items created.' });
        }

        res.json({
            message: "ItemsCheck Created",
            data: itemsCheck
        });
    } catch (error) {
        console.error('Error creating items check:', error); // Логируем ошибку на сервере
        res.status(500).json({ message: error.message });
    }  
}

export const restoreItemsCheck = async (req, res) => {
    try {
        // Логируем исходные данные
        console.log('Received body:', req.body);
        const restoredItemsBatch = [];

        for (const item of req.body) {
            if (item.serialNumber) {
                // 1. Если есть serialNumber, ищем запись в ItemCheck
                const checkItem = await ItemCheck.findOne({ where: { serialNumber: item.serialNumber } });

                if (checkItem) {
                    // Удаляем запись из ItemCheck
                    await ItemCheck.destroy({
                        where: { serialNumber: item.serialNumber }
                    });
                    const check = await CheckType.findOne({
                        where: {
                            checkId: checkItem.checkId
                        }
                    });

                    await CheckType.update({
                        summ: check.summ - checkItem.salePrice
                    },{
                        where: { checkId: checkItem.checkId }
                    });

                    const accountingOffice = await Accounting.findOne({
                        where: {
                            justification: checkItem.checkId.toString(),  accountFrom: null
                        }
                    });

                    if (accountingOffice) {
                        if (Number(accountingOffice.value) - Number(checkItem.salePrice) === 0) {
                        await Accounting.destroy({
                            where: { justification: checkItem.checkId.toString(),  accountFrom: null}
                        });
                    } else {
                        await Accounting.update({
                            value: Number(accountingOffice.value) - Number(checkItem.salePrice)
                        },{
                            where: { justification: checkItem.checkId.toString(),  accountFrom: null}
                        });
                    }
                    }
                    

                    

                    const accounting = await Accounting.findOne({
                        where: {
                            justification: checkItem.checkId.toString(),  accountTo: null
                        }
                    });
                    
                    if (accounting && checkItem.partner) {
                        if (Number(accounting.value) - Number(checkItem.salePrice) === 0) {
                            await Accounting.destroy({
                                where: { justification: checkItem.checkId.toString(),  accountTo: null}
                            });
                        } else {
                            await Accounting.update({
                                value: Number(accounting.value) - Number(checkItem.salePrice)
                            },{
                                where: { justification: checkItem.checkId.toString(),  accountTo: null}
                            });
                        }
                    }
                    if (accounting && checkItem.partner) {
                    const account = await Accounts.findOne({
                        where: {
                            name: accounting.accountFrom
                        }
                    });

                    await Accounts.update({
                        value: Number(account.value) + Number(checkItem.salePrice)
                    },{
                        where: { name: accounting.accountFrom}
                    });
                    }
                    
                    const accountOffice = await Accounts.findOne({
                        where: {
                           name: check.account
                        }
                    });
                    if (accountOffice && accountingOffice) {
                        await Accounts.update({
                        value: Number(accountOffice.value) - Number(checkItem.salePrice)
                        },{
                            where: { name: check.account}
                        });
                        }

                    // Восстанавливаем данные на складе в ItemBatch
                    const batchItem = await ItemBatch.findOne({ where: { serialNumber: item.serialNumber } });
                    
                    if (batchItem) {
                        await ItemBatch.update({
                            isSaled: false, // Сбрасываем isSaled
                        }, {
                            where: { itemBatchId: batchItem.itemBatchId }
                        });
                    } else {
                        console.warn(`No itemsBatch found for serialNumber: ${item.serialNumber}`);
                    }
                } else {
                    console.warn(`No checkItem found for serialNumber: ${item.serialNumber}`);
                }
            } else {
                const checkItem = await ItemCheck.findOne({ where: { saleId: item.saleId } });

                if (checkItem) {
                    // Удаляем запись из ItemCheck
                    await ItemCheck.destroy({
                        where: { saleId: item.saleId }
                    });

                    const check = await CheckType.findOne({
                        where: {
                            checkId: item.checkId
                        }
                    });

                    await CheckType.update({
                        summ: check.summ - item.salePrice
                    },{
                        where: { checkId: item.checkId }
                    });

                    const accounting = await Accounting.findOne({
                        where: {
                            justification: checkItem.checkId.toString(),  accountTo: null
                        }
                    });

                    if (accounting && checkItem.partner) {
                        if (Number(accounting.value) - Number(checkItem.salePrice) === 0) {
                            await Accounting.destroy({
                                where: { justification: checkItem.checkId.toString(),  accountTo: null}
                            });
                        } else {
                            await Accounting.update({
                                value: Number(accounting.value) - Number(checkItem.salePrice)
                            },{
                                where: { justification: checkItem.checkId.toString(),  accountTo: null}
                            });
                        }
                    }
                    if (accounting && checkItem.partner) {
                    const account = await Accounts.findOne({
                        where: {
                            name: accounting.accountFrom
                        }
                    });
                    await Accounts.update({
                        value: Number(account.value) + Number(checkItem.salePrice)
                    },{
                        where: { name: accounting.accountFrom}
                    });
                    }

                    const accountingOffice = await Accounting.findOne({
                        where: {
                            justification: checkItem.checkId.toString(),  accountFrom: null
                        }
                    });

                    if (Number(accountingOffice.value) - Number(checkItem.salePrice) === 0) {
                        await Accounting.destroy({
                            where: { justification: checkItem.checkId.toString(),  accountFrom: null}
                        });
                    } else {
                        await Accounting.update({
                            value: Number(accountingOffice.value) - Number(checkItem.salePrice)
                        },{
                            where: { justification: checkItem.checkId.toString(),  accountFrom: null}
                        });
                    }


                    const accountOffice = await Accounts.findOne({
                        where: {
                           name: check.account
                        }
                    });
                    if (accountOffice && accountingOffice) {
                        await Accounts.update({
                        value: Number(accountOffice.value) - Number(checkItem.salePrice)
                        },{
                            where: { name: check.account}
                        });
                        }
                    

                    const batchItem = await ItemBatch.findOne({
                        where: {
                            itemId: item.itemId,
                            batchId: item.batchId,
                        },
                        order: [['itemBatchId', 'ASC']],
                    });

                    if (batchItem) {
                        // Увеличиваем remainder на 1
                        await ItemBatch.update({
                            remainder: batchItem.remainder + 1,
                        }, {
                            where: { itemBatchId: batchItem.itemBatchId }
                        });
                    } else {
                        console.warn(`No available itemsBatch found for itemId: ${item.itemId}`);
                    }
                } else {
                    console.warn(`No checkItem found for itemId: ${item.itemId}`);
                }
            }

            // Добавляем восстановленную запись в массив
            restoredItemsBatch.push(item);
        }

        // Возвращаем успешный ответ с восстановленными записями
        res.json({
            message: "ItemsCheck Restored",
            data: restoredItemsBatch
        });
    } catch (error) {
        console.error('Error restoring items check:', error); // Логируем ошибку на сервере
        res.status(500).json({ message: error.message });
    }
}