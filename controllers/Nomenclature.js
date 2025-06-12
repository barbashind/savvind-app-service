import Nomenclature from "../models/nomenclatureModel.js";
import ItemBatch from '../models/itemsBatchModel.js';
import ItemCheck from '../models/itemsCheckModel.js'
import { Op } from "sequelize";
import multer from 'multer';
import ExcelJS from 'exceljs'
import CheckType from "../models/checkModel.js";
 
export const nomenclatureFilter = async (req, res) => {
    try {
        const whereConditions = {};
        if (req.body.name) {
            whereConditions.name = {
                    [Op.like]: `%${req.body.name}%`
                };
        }
        if (req.body.brand) {
                whereConditions.brand = {
                        [Op.like]: `%${req.body.brand}%`
                    };
        }
        if (req.body.productType) {
                whereConditions.productType = {
                        [Op.like]: `%${req.body.productType}%`
                    };
        }
        if (req.body.productModel) {
                whereConditions.productModel = {
                        [Op.like]: `%${req.body.productModel}%`
                    };
        }
        if (req.body.remainsMin) {
                whereConditions.remains = {
                    [Op.gt]: req.body.remainsMin
                };
            }
        if (req.body.remainsMax) {
                whereConditions.remains = {
                    [Op.lt]: req.body.remainsMax
                };
            }
        if (req.body.remainsSumMin) {
                whereConditions.remainsSum = {
                    [Op.gt]: req.body.remainsSumMin
                };
            }
        if (req.body.remainsSumMax) {
                whereConditions.remainsSum = {
                    [Op.lt]: req.body.remainsSumMax
                };
            }
        if (req.body.searchText) {
            whereConditions[Op.or] = [
                { name: { [Op.like]: `%${req.body.searchText}%`} },
                { brand: { [Op.like]: `%${req.body.searchText}%` } },
                { EAN: { [Op.like]: `%${req.body.searchText}%` } }
            ];
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
        
        const { count, rows } = await Nomenclature.findAndCountAll({
            where: whereConditions,
            order: orderBy.length ? orderBy : null,
            limit: size,
            offset: page * size,
        });

        // Получаем все itemId из найденных записей
        const itemIds = rows.map(row => row.itemId);

        // Выполняем запрос для получения количества забронированных для каждого itemId
        const bookedPromises = itemIds.map(async itemId => {
            const salesRecords = await ItemCheck.findAll({
                where: { itemId },
            });

            const bookedRecords = await Promise.all(salesRecords.map(async item => {
                const checkType = await CheckType.findOne({
                    where: { checkId: item.checkId },
                });
                // Возвращаем объект с элементом и значением isBooking
                return { ...item, isBooking: checkType?.isBooking };
            })).then(results => results.filter(item => item.isBooking));
           
           

            return {
                itemId,
                booked: bookedRecords.length
            };
        });

        // Ждем завершения всех запросов
        const bookedResults = await Promise.all(bookedPromises);

        // Формируем итоговый результат
        const finalResults = rows.map(row => {
            const bookedCount = bookedResults.find(result => result.itemId === row.itemId)?.booked || 0;
            return {
                ...row.dataValues,
                booked: bookedCount
            };
        });

        // Формируем ответ в формате TPageableResponse
        const response = {
            content: finalResults,
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

export const getNomenclatureAll = async (req, res) => {
    try {
        const response = await Nomenclature.findAll({
        });
        res.json(response);
    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const updateNomenclatureRemains = async (req, res) => {
    try {
        // Получаем все номенклатуры
        const rows = await Nomenclature.findAll();

        for (const nomenclature of rows) {
                if (nomenclature.hasSerialNumber) {
                    // Получение количества записей в items_batch с заполненным serialNumber и isSaled === false
                    const count = await ItemBatch.count({
                        where: {
                            itemId: nomenclature.itemId,
                            serialNumber: { [Op.ne]: null },
                            [Op.or]: [
                                { isSaled: false },
                                { isSaled: null }
                            ]
                        }
                    });
                    nomenclature.remains = count;
    
                } else {
                    // Получение суммы remainder у записей с таким же itemId
                    const totalRemainder = await ItemBatch.sum('remainder', {
                        where: { itemId: nomenclature.itemId }
                    });
                    nomenclature.remains = totalRemainder || 0;
                }
            

            // Обновляем remainsSum в таблице Nomenclature
            await Nomenclature.update(
                { remainsSum: nomenclature.remains },
                { where: { itemId: nomenclature.itemId } }
            );
        }
        

        res.json({ message: 'Остатки успешно обновлены' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getNomenclatureById = async (req, res) => {
        try {
            const nomenclature = await Nomenclature.findOne({
                where: {
                    itemId: req.params.itemId
                }
            });
            const lastItemBatch = await ItemBatch.findOne({
                where: {
                    itemId: req.params.itemId
                },
                order: [['itemBatchId', 'DESC']] // Сортируем по itemBatchId в порядке убывания
            });
            const lastCostPriceAll = lastItemBatch ? lastItemBatch.costPriceAll : 0
            res.json({
                ...nomenclature.toJSON(), 
                lastCostPriceAll
            });
        } catch (error) {
            res.json({ message: error.message });
        }  
    }

//     export const getNomenclatureBySearchText = async (req, res) => {
//         try {
//             const nomenclatures = await Nomenclature.findAll({
//                 where: {
//                     name: req.params.name
//                 } 
//             });
//             res.json(nomenclatures);
//         } catch (error) {
//             res.json({ message: error.message });
//         }  
//     }
     
    export const createNomenclature = async (req, res) => {
        try {
            const user = req.user;
            if (!req.body.name) {
                const error = { advice: 'name', statusText: `Введите наименование`, status: 0,  timestamp: '0'};
                return res.status(400).json({ error });
            }
            if (!req.body.EAN && user.role === 'KUR') {
                const error = { advice: 'ean', statusText: `Введите EAN/UPC`, status: 0,  timestamp: '0'};
                return res.status(400).json({ error });
            }
            const existingNomenclature = await Nomenclature.findOne({
                where:
                    { EAN: req.body.EAN }
            });

            if (existingNomenclature) {
                const error = { advice: 'ean', statusText: 'Такой EAN/UPC уже существует', status: 0, timestamp: '0' };
                return res.status(400).json({ error });
            }

            await Nomenclature.create(req.body);
            res.json({
                "message": "Запись создана"
            });
        } catch (error) {
            res.json({ message: error.message });
        }  
    }
     
    export const updateNomenclature = async (req, res) => {
        try {
            await Nomenclature.update(req.body, {
                where: {
                    itemId: req.params.itemId
                }
            });
            res.json({
                "message": "Запись успешно обновлена"
            });
        } catch (error) {
            res.json({ message: error.message });
        }  
    }
     
    export const deleteNomenclature = async (req, res) => {
        try {
            await Nomenclature.destroy({
                where: {
                    itemId: req.params.itemId
                }
            });
            res.json({
                "message": "Nomenclature Deleted"
            });
        } catch (error) {
            res.json({ message: error.message });
        }  
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, '../uploads/'); // Путь к папке для сохранения
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname)); // Уникальное имя для файла
        }
    });
    
    export const getProductsFile = async (req, res) => {
    const upload = multer({ storage });
        // Вызов middleware для загрузки файла
        upload.single('file')(req, res, async () => {
           
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.read(req);
                const worksheet = workbook.getWorksheet(1);
    
                // Перебираем строки в Excel файле
                for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
                    const row = worksheet.getRow(rowNumber);
    
                    const name = row.getCell(1).value;
                    const lastCostPrice = row.getCell(2).value;
                    const weight = row.getCell(3).value;
                    const productHeight = row.getCell(4).value;
                    const productWidth = row.getCell(5).value;
                    const isMessageActive = row.getCell(6).value;
                    const productType = row.getCell(7).value;
                    const brand = row.getCell(8).value;
                    const productLength = row.getCell(9).value;
                    const altName = row.getCell(10).value;
                    const productColor = row.getCell(11).value;
                    const productPrice = row.getCell(12).value;
                    const printName = row.getCell(13).value;
                    const productModel = row.getCell(14).value;
                    const productMemory = row.getCell(15).value;
                    const productCountry = row.getCell(16).value;
                    const productSim = row.getCell(17).value;
                    const hasSerialNumber = row.getCell(18).value;
                    const EAN = row.getCell(19).value;
                    const serialNumberStart = row.getCell(20).value;
                    const stopWords = row.getCell(21).value;
                    
                    let warehouseProduct = null;
    
                    // Создаем новую запись
                    warehouseProduct = await Nomenclature.create({ 
                        name, 
                        lastCostPrice, 
                        weight, 
                        productHeight, 
                        productWidth,
                        isMessageActive,
                        productType,
                        brand,
                        productLength,
                        altName,
                        productColor,
                        productPrice,
                        printName,
                        productModel,
                        productMemory,
                        productCountry,
                        productSim,
                        hasSerialNumber,
                        EAN,
                        serialNumberStart,
                        stopWords
                    });
    
                }
    
                res.send('File processed and data inserted successfully!');
            
        });
    };


    export const getItemsStatById = async (req, res) => {
        const itemId = req.params.itemId; 
    
        try {
            const items = await ItemCheck.findAll({
                where: {
                    itemId: itemId 
                }
            });
            const salledAll = items?.length;
            const dates = [...new Set(items.map(item => item.createdAt))];


            const sales = dates.map( date => ({
                serialNumbers: items?.filter(item => (item.createdAt === date))?.map(elem => elem.serialNumber),
                date: date,
                saled: items?.filter(item => (item.createdAt === date))?.length,
            }))

            const dataStat = {
                sales,
                salledAll: salledAll,
            };
    
            res.json(dataStat);
    
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };