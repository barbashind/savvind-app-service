import Batch from "../models/batchModel.js";
import ItemBatch from "../models/itemsBatchModel.js";
import { Op } from 'sequelize';

export const purchaseFilter = async (req, res) => {
    try {
        const whereConditions = {};
        const batchIds = [];
        if (req.body.batchNumber) {
                whereConditions.batchNumber = {
                        [Op.like]: `%${req.body.batchNumber}%`
                    };
        }
        if (req.body.batchStatus) {
            whereConditions.batchStatus = {
                    [Op.like]: `%${req.body.batchStatus}%`
                };
    }
        if (req.body.sumMin) {
                whereConditions.sum = {
                    [Op.gt]: req.body.sumMin
                };
            }
        if (req.body.sumMax) {
                whereConditions.sum = {
                    [Op.lt]: req.body.sumMax
                };
            }
        if (req.body.dateMin) {
                whereConditions.createdAt = {
                    [Op.gt]: req.body.remainsSumMin
                };
            }
        if (req.body.dateMax) {
                whereConditions.createdAt = {
                    [Op.lt]: req.body.remainsSumMax
                };
            }

        if (Array.isArray(req.body.batchStatus) && req.body.batchStatus.length > 0) {
                whereConditions.batchStatus = {
                    [Op.in]: req.body.batchStatus
                };
            }
        if (req.body.itemId) {
                const itemsBatchRecords = await ItemBatch.findAll({
                    where: { itemId: req.body.itemId },
                });
    
                if (itemsBatchRecords.length > 0) {
                    batchIds.push(...itemsBatchRecords.map(record => record.batchId));
                }
        }
    
        if (batchIds.length > 0) {
                whereConditions.batchId = {
                    [Op.in]: batchIds 
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
        
        const { count, rows } = await Batch.findAndCountAll({
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
 
export const getBatchByNumber = async (req, res) => {
    try {
        const batch = await Batch.findAll({
            where: {
                label: req.params.batchNumber
            }
        });
        res.json(batch[0]);
    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const getBatchById = async (req, res) => {
    try {
        const batch = await Batch.findAll({
            where: {
                batchId: req.params.id
            }
        });
        res.json(batch[0]);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const createBatch = async (req, res) => {
    try {
         // Проверяем, есть ли данные в body
         if (!(req.body.batchNumber)) {
            return res.status(400).json({errors: [{state: 'batchNumber', caption: 'Укажите номер партии' }]});
        }

        // Проверка на уникальность batchNumber
         const existingBatch = await Batch.findOne({ where: { batchNumber: req.body.batchNumber } });
         if (existingBatch) {
             return res.status(400).json({ errors: [{ state: 'batchNumber', caption: 'Этот номер партии уже существует' }] });
         }

        // Проверяем, есть ли данные в body
        if (!Array.isArray(req.body.body) || req.body.body.length === 0) {
            return res.status(400).json({ errors:  [{state: 'global', caption: 'В партии отсутствуют товары' }] });
        }

        const errors = [];
        const itemIds = new Set();

        req.body.body.forEach((item, index) => {
            // Проверка на пустое значение itemId
            if (!item.itemId) {
                errors.push({ state: 'itemId', caption: `Выберите товар`, index: index });
            } else

            // Проверка на пустое значение quant
            if (item.quant === undefined || item.quant === null || item.quant <= 0) {
                errors.push({ state: 'quant', caption: `Укажите кол-во`, index: index  });
            } else {
                itemIds.add(item.itemId);
            }

            // // Проверка на дублирование itemId
            // if (itemIds.has(item.itemId)) {
            //     errors.push({ state: 'itemId', caption: `Товар дублируется`, index: index });
            // } else {
            //     itemIds.add(item.itemId);
            // }
        });

        // Если есть ошибки, возвращаем их
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors });
        }
        const createdBatch = await Batch.create(req.body);
        res.json({
            createdBatch
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const updateBatch = async (req, res) => {
    try {
        // Проверяем, есть ли данные в body
        if (!Array.isArray(req.body.body) || req.body.body.length === 0) {
            return res.status(400).json({ errors:  [{state: 'global', caption: 'В партии отсутствуют товары' }] });
        }

        const errors = [];
        const itemIds = new Set();

        req.body.body.forEach((item, index) => {
            // Проверка на пустое значение itemId
            if (!item.itemId) {
                errors.push({ state: 'itemId', caption: `Выберите товар`, index: index });
            }

            // Проверка на пустое значение quant
            else if (item.quant === undefined || item.quant === null || item.quant <= 0) {
                errors.push({ state: 'quant', caption: `Укажите кол-во`, index: index  });
            } else {
                itemIds.add(item.itemId);
            }
        });

        // Если есть ошибки, возвращаем их
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors });
        }
        await Batch.update(req.body, {
            where: {
                batchId: req.params.batchId
            }
        });
        // Получаем обновленные записи
        const updatedBatches = await Batch.findAll({
            where: {
                batchId: req.params.batchId
            }
        });

        const updatedBatch = updatedBatches[0]
        res.json({
              updatedBatch
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const deleteBatch = async (req, res) => {
    try {
        await ItemBatch.destroy({
            where: {
                batchId: req.params.batchId
            }
        });
        await Batch.destroy({
            where: {
                batchId: req.params.batchId
            }
        });
        res.json({
            "message": "Batch Deleted"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}