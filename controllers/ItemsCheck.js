import Accounting from "../models/accountingModel.js";
import CheckType from "../models/checkModel.js";
import ItemBatch from "../models/itemsBatchModel.js";
import ItemCheck from "../models/itemsCheckModel.js";
import { Op } from 'sequelize';
import sequelize from 'sequelize';
import { Accounts } from "../models/settingsModel.js";

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
    try {
        const item = await ItemCheck.findAll({
            where: {
                checkId: req.params.checkId
            }
        });
        res.json(item);
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
                    if (accountOffice) {
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
                    if (accountOffice) {
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