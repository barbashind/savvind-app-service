import Accounting from "../models/accountingModel.js";
import { Op } from 'sequelize';
import { Accounts } from "../models/settingsModel.js";

export const accountingFilter = async (req, res) => {
    const user = req.user;
    try {
        const whereConditions = {};
        if (user.role === 'SLR') {
            whereConditions[Op.or] = [
                { 
                    accountFrom: { [Op.like]: `Деньги в офисе`},
                    accountTo: null,
                },
                { 
                    accountFrom: null,
                    accountTo: { [Op.like]: `Деньги в офисе` } 
                }
            ];
        }

        if (req.body.searchText) {
            whereConditions[Op.or] = [
                { accountFrom: { [Op.like]: `%${req.body.searchText}%`} },
                { accountTo: { [Op.like]: `%${req.body.searchText}%` } }
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
        
        const { count, rows } = await Accounting.findAndCountAll({
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
 
export const getAccountingById = async (req, res) => {
    try {
        const accounting = await Accounting.findAll({
            where: {
                id: req.params.id
            }
        });
        res.json(accounting[0]);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const createAccounting = async (req, res) => {
    try {

        if (req.body.accountFrom && req.body.value) {
            const accountFrom = await Accounts.findOne({
                where: { name: req.body.accountFrom }
            })
            await Accounts.update({
                value: Number(accountFrom.value) - Number(req.body.value)
            }, {
                where: {
                    name: req.body.accountFrom 
                }
            })
        }

        if (req.body.accountTo && req.body.value) {
            const accountFrom = await Accounts.findOne({
                where: { name: req.body.accountTo }
            })
            await Accounts.update({
                value: Number(accountFrom.value) + Number(req.body.value)
            }, {
                where: {
                    name: req.body.accountTo
                }
            })
        }

        const errors = [];
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors });
        }
        const createdAccounting = await Accounting.create(req.body);
        res.json({
            createdAccounting
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const updateAccounting = async (req, res) => {
    try {
        const accounting = await Accounting.findOne({
            where: {
                id: req.params.id
            }
        });

        const accountFrom = await Accounts.findOne({
            where: {
                name: req.body.accountFrom
            }
        });

        const accountTo = await Accounts.findOne({
            where: {
                name: req.body.accountTo
            }
        });


        const currentValueFrom = Number(accountFrom?.value ?? 0);
        const currentValueTo = Number(accountTo?.value ?? 0);
        const newValue = Number(req.body.value);
        
        const dif = newValue - Number(accounting.value);

        if (accountFrom) {
            await Accounts.update({
            value: currentValueFrom - dif
        }, {
            where: {
                name: req.body.accountFrom
            }
        });
        }
        
        if (accountTo) {
            await Accounts.update({
            value: currentValueTo + dif
        }, {
            where: {
                name: req.body.accountTo
            }
        });
        }

        

        
        await Accounting.update(req.body, {
            where: {
                id: req.params.id
            }
        });
        // Получаем обновленные записи
        const updatedAccountings = await Accounting.findAll({
            where: {
                id: req.params.id
            }
        });

        const updatedAccounting = updatedAccountings[0]
        res.json({
            updatedAccounting
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const deleteAccounting = async (req, res) => {
    try {
        const accounting = await Accounting.findOne({
            where: {
                id: req.params.id
            }
        })
        if (accounting.accountFrom) {
            const accountFrom = await Accounts.findOne({
                where: { name: accounting.accountFrom }
            })
            await Accounts.update({
                value: Number(accountFrom.value) + Number(accounting.value)
            }, {
                where: {
                    name: accounting.accountFrom 
                }
            })
        }

        if (accounting.accountTo) {
            const accountFrom = await Accounts.findOne({
                where: { name: accounting.accountTo }
            })
            await Accounts.update({
                value: Number(accountFrom.value) - Number(accounting.value)
            }, {
                where: {
                    name: accounting.accountTo
                }
            })
        }
        
        await Accounting.destroy({
            where: {
                id: req.params.id
            }
        });
        res.json({
            "message": "Accounting Deleted"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}