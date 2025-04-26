import ItemBatch from '../models/itemsBatchModel.js'
import ItemBatchReg from '../models/itemsBatchRegModel.js';
import { Op } from 'sequelize';
import Nomenclature from '../models/nomenclatureModel.js';
 
export const getItemsBatchByNumber = async (req, res) => {
    try {
        const batch = await ItemBatch.findAll({
            where: {
                batchNumber: req.params.batchNumber
            }
        });
        res.json(batch[0]);
    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const getItemsBatchById = async (req, res) => {
    try {
        const batch = await ItemBatch.findAll({
            where: {
                batchId: req.params.batchId
            }
        });
        res.json(batch);
    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const getItemsBatchFilter = async (req, res) => {
    try {
        const whereConditions = {};
        if (req.body.searchText) {
                whereConditions.name = {
                        [Op.like]: `%${req.body.searchText}%`
                    };
        }
        if (req.body.warehouse) {
            whereConditions.warehouse = {
                    [Op.like]: `%${req.body.warehouse}%`
                };
        }
        
        whereConditions[Op.or] = [
            { hasSerialNumber: false },
            { hasSerialNumber: true, serialNumber: null }
        ];

        const whereConditionsDef = {};
        if (req.body.searchText) {
            whereConditionsDef.name = {
                        [Op.like]: `%${req.body.searchText}%`
                    };
        }
        if (req.body.warehouse) {
            whereConditionsDef.warehouse = {
                    [Op.like]: `%${req.body.warehouse}%`
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
        
        const rowsGr  = await ItemBatch.findAll({
            where: whereConditionsDef,
        });

        const { count, rows } = await ItemBatch.findAndCountAll({
            where: whereConditions,
            order: orderBy.length ? orderBy : null,
            limit: size,
            offset: page * size,
        });

        const rowsGrF = rows?.map(
            elem => {
                if (!elem.hasSerialNumber) {
                    return elem
                } else  {
                    return {
                        remainder: rowsGr?.filter(el => (el.itemId === elem.itemId) && (el.partner === elem.partner) && (el.batchId === elem.batchId) && el.serialNumber && !el.isSaled).length,
                        name: elem.name,
                        itemBatchId: elem.itemBatchId,
                        warehouse: elem.warehouse,
                        hasSerialNumber: elem.hasSerialNumber,
                    }
                 }
                }
        )
        
        // Формируем ответ в формате TPageableResponse
        const response = {
            content: rowsGrF,
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

export const getItemsBatchForReturn = async (req, res) => {
    try {
        const whereConditions = { hasSerialNumber: false, remainder: {
            [Op.gt]: 0 
        } };

        if (req.body.searchText) {
                whereConditions.name = {
                        [Op.like]: `%${req.body.searchText}%`
                    };
        }
        if (req.body.warehouse) {
            whereConditions.warehouse = {
                    [Op.like]: `%${req.body.warehouse}%`
                };
        }

        const response  = await ItemBatch.findAll({
            where: whereConditions,
        });    
        
        
    res.json(response);

    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const getItemsBatchRegById = async (req, res) => {
    try {
        const batch = await ItemBatchReg.findAll({
            where: {
                batchId: req.params.batchId
            }
        });
        res.json(batch);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const createItemsBatch = async (req, res) => {
    try {
        // Логируем исходные данные
        console.log('Received body:', req);
        
        
        // Создаем элементы партии
        const itemsBatches = await ItemBatch.bulkCreate(req.body);

        for (const item of req.body) {
            await Nomenclature.update({lastCostPrice: item.costPrice}, {where: {
                itemId: item.itemId
            }})
        }

        // Если нет созданных элементов, возвращаем соответствующее сообщение
        if (itemsBatches.length === 0) {
            return res.status(500).json({ message: 'No items created.' });
        }

        res.json({
            message: "ItemsBatch Created",
            data: itemsBatches
        });
    } catch (error) {
        console.error('Error creating items batch:', error); // Логируем ошибку на сервере
        res.status(500).json({ message: error.message });
    }  
}
 
export const updateItemsBatch = async (req, res) => {
    try {
        // Итерируемся по элементам из тела запроса
        const itemsBatches = req.body;
        const creations = itemsBatches.filter(item => !item.itemBatchId);
        // Обрабатываем каждый элемент
        const promises = itemsBatches.map(async (item) => {
            if (item.itemBatchId) {
                // Обновляем записи, где заполнен itemBatchId
                return await ItemBatch.update(item, {
                    where: {
                        itemBatchId: item.itemBatchId
                    }
                });
            }
            // if (item.hasSerialNumber) {
            //     return await ItemBatch.destroy({
            //         where: {
            //             itemId: item.itemId,
            //             batchId: item.batchId,
            //             serialNumber:{ [Op.ne]: null } 
            //         }
            //     });
            // }

        });


        

        // Выполняем все операции
        await Promise.all(promises);

        // Пакетное создание
        if (creations.length > 0) {
            await ItemBatch.bulkCreate(creations); // Используем bulkCreate для создания
        }

        res.json({
            message: "ItemsBatch Updated or Created",
            data: itemsBatches
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }  
}

export const returnItemBatch = async (req, res) => {
    try {
        const batchItem = await ItemBatch.findOne({
            where: {
                itemBatchId: req.params.itemBatchId,
            },
        });

        await ItemBatch.update({
            remainder:  batchItem.remainder - 1
        },{
            where: {
                itemBatchId: req.params.itemBatchId,
            }
        });

        res.json({
            "message": "Batch item returned"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const changeWarehouseItemSerialNum = async (req, res) => {
    try {
        const  warehouse = req.body.warehouse;
        const  serialNumbers = req.body.serialNumbers;
        console.log(req.body)
        if (!serialNumbers || !Array.isArray(serialNumbers)) {
            return res.status(400).json({ message: "Invalid serial numbers format" });
        }

        const updateResult = await ItemBatch.update(
            { warehouse },
            {
                where: {
                    serialNumber: {
                        [Op.in]: serialNumbers 
                    }
                }
                }
        );

        if (updateResult[0] === 0) {
            return res.status(404).json({ message: "No items found with the provided serial numbers" });
        }

        res.json({
            message: "Warehouse ID updated for specified serial numbers"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const changeWarehouseItem = async (req, res) => {
    try {
        const warehouse = req.body.warehouse;
        const itemBatchId = req.body.itemBatchId;
        const quant = req.body.quant;

        if (!warehouse || !itemBatchId || !quant) {
            return res.status(400).json({ message: "Invalid data" });
        }

        // Получаем текущую запись по itemBatchId
        const itemBatch = await ItemBatch.findOne({
            where: {
                itemBatchId: itemBatchId
            }
        });

        if (!itemBatch) {
            return res.status(404).json({ message: "Item not found" });
        }

        // Если quant равно remainder
        if (quant === itemBatch.remainder) {
            await ItemBatch.update(
                { warehouse: warehouse },
                {
                    where: {
                        itemBatchId: itemBatchId
                    }
                }
            );
        } else if (quant < itemBatch.remainder) {
            // Вычитаем quant из remainder
            await ItemBatch.update(
                { remainder: itemBatch.remainder - quant },
                {
                    where: {
                        itemBatchId: itemBatchId
                    }
                }
            );

            // Создаем новую запись
            await ItemBatch.create({
                ...itemBatch.dataValues, // Копируем все значения
                
                remainder: quant,          // Устанавливаем новое значение remainder
                warehouse: warehouse       // Устанавливаем новое значение warehouse
            });
        } else {
            return res.status(400).json({ message: "Quant is greater than remainder" });
        }

        res.json({
            message: "Updated successfully"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
 
export const deleteItemBatch = async (req, res) => {
    try {
        await ItemBatch.destroy({
            where: {
                itemBatchId: req.params.itemBatchId,
            }
        });
        res.json({
            "message": "Batch item Deleted"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const deleteItemsBatch = async (req, res) => {
    try {
        await ItemBatch.destroy({
            where: {
                batchId: req.params.batchId,
            }
        });
        res.json({
            "message": "Batch item Deleted"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}