import BatchReg from "../models/batchRegModel.js";

 
export const getAllBatchesReg = async (req, res) => {
    try {
        const whereConditions = {batchStatus: 'REGISTRATION'};

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
        
        const { count, rows } = await BatchReg.findAndCountAll({
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
 

export const getBatchRegById = async (req, res) => {
    try {
        const batch = await BatchReg.findAll({
            where: {
                batchId: req.params.batchId
            }
        });
        res.json(batch[0]);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 

 
export const updateRegBatch = async (req, res) => {
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
            if (item.quant === undefined || item.quant === null || item.quant <= 0) {
                errors.push({ state: 'quant', caption: `Укажите кол-во`, index: index  });
            }

            // Проверка на дублирование itemId
            if (itemIds.has(item.itemId)) {
                errors.push({ state: 'itemId', caption: `Товар дублируется`, index: index });
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
        res.json({
            "message": "Batch Updated"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}