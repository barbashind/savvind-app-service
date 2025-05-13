import Contractor from "../models/contractorsModel.js";
import Deliver from "../models/deliversModel.js";
import Users, { Accounts, Categories, Currencies, Warehouses } from "../models/settingsModel.js";

export const getAllAccounts = async (req, res) => {
    const user = req.user;
    try {
        const accountsData = []
        const accounts = await Accounts.findAll();
        if (user.role === 'SLR') {
            accountsData.push(...accounts.filter((el) => (el.name === 'Деньги в офисе')))
        } else {
            accountsData.push(...accounts) 
        }
        
        res.json(accountsData);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const updateAccounts = async (req, res) => {
    try {
        const errors = [];

        // Проверяем на наличие ошибок
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors });
        }

        // Обрабатываем каждую запись в теле запроса
        const accounts = req.body;

        for (const account of accounts) {
            if (account.accountId) {
                // Обновляем существующую запись
                await Accounts.update(account, { where: { accountId: account.accountId } });
            } else {
                // Создаем новую запись
                await Accounts.create(account);
            }
        }

        // Получаем все актуальные записи из БД
        const allAccounts = await Accounts.findAll();
        
        res.json({
            allAccounts
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 

 
export const deleteAccount = async (req, res) => {
    try {
        await Accounts.destroy({
            where: {
                accountId: req.params.accountId
            }
        });
        res.json({
            "message": "Accounting Deleted"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const getAllCategories = async (req, res) => {
    try {
        const accounts = await Categories.findAll();
        res.json(accounts);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const updateCategories = async (req, res) => {
    try {
        const errors = [];

        // Проверяем на наличие ошибок
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors });
        }

        // Обрабатываем каждую запись в теле запроса
        const accounts = req.body;

        for (const account of accounts) {
            if (account.id) {
                // Обновляем существующую запись
                await Categories.update(account, { where: { id: account.id } });
            } else {
                // Создаем новую запись
                await Categories.create(account);
            }
        }

        // Получаем все актуальные записи из БД
        const allAccounts = await Categories.findAll();
        
        res.json({
            allAccounts
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 

 
export const deleteCategory = async (req, res) => {
    try {
        await Categories.destroy({
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


export const getAllUsers = async (req, res) => {
    try {
        const accounts = await Users.findAll();
        res.json(accounts);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const updateUsers = async (req, res) => {
    try {
        const errors = [];

        // Проверяем на наличие ошибок
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors });
        }

        // Обрабатываем каждую запись в теле запроса
        const accounts = req.body;

        for (const account of accounts) {
            if (account.id) {
                // Обновляем существующую запись
                await Users.update(account, { where: { id: account.id } });
            } else {
                // Создаем новую запись
                await Users.create(account);
            }
        }

        // Получаем все актуальные записи из БД
        const allAccounts = await Users.findAll();
        
        res.json({
            allAccounts
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 

 
export const deleteUser = async (req, res) => {
    try {
        await Users.destroy({
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

export const getAllWarehouses = async (req, res) => {
    try {
        const accounts = await Warehouses.findAll();
        res.json(accounts);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const updateWarehouses = async (req, res) => {
    try {
        const errors = [];

        // Проверяем на наличие ошибок
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors });
        }

        // Обрабатываем каждую запись в теле запроса
        const accounts = req.body;

        for (const account of accounts) {
            if (account.warehouseId) {
                // Обновляем существующую запись
                await Warehouses.update(account, { where: { warehouseId: account.warehouseId } });
            } else {
                // Создаем новую запись
                await Warehouses.create(account);
            }
        }

        // Получаем все актуальные записи из БД
        const allAccounts = await Warehouses.findAll();
        
        res.json({
            allAccounts
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 

 
export const deleteWarehouse = async (req, res) => {
    try {
        await Warehouses.destroy({
            where: {
                warehouseId: req.params.warehouseId
            }
        });
        res.json({
            "message": "Accounting Deleted"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const updateContractors = async (req, res) => {
    try {
        const errors = [];

        // Проверяем на наличие ошибок
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors });
        }

        // Обрабатываем каждую запись в теле запроса
        const accounts = req.body;

        for (const account of accounts) {
            if (account.contractorId) {
                // Обновляем существующую запись
                await Contractor.update(account, { where: { contractorId: account.contractorId } });
            } else {
                // Создаем новую запись
                await Contractor.create(account);
            }
        }

        // Получаем все актуальные записи из БД
        const allAccounts = await Contractor.findAll();
        
        res.json({
            allAccounts
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 

 
export const deleteContractor = async (req, res) => {
    try {
        await Contractor.destroy({
            where: {
                contractorId: req.params.contractorId
            }
        });
        res.json({
            "message": "Accounting Deleted"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const updateDelivers = async (req, res) => {
    try {
        const errors = [];

        // Проверяем на наличие ошибок
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors });
        }

        // Обрабатываем каждую запись в теле запроса
        const accounts = req.body;

        for (const account of accounts) {
            if (account.deliverId) {
                // Обновляем существующую запись
                await Deliver.update(account, { where: { deliverId: account.deliverId } });
            } else {
                // Создаем новую запись
                await Deliver.create(account);
            }
        }

        // Получаем все актуальные записи из БД
        const allAccounts = await Deliver.findAll();
        
        res.json({
            allAccounts
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 

 
export const deleteDeliver = async (req, res) => {
    try {
        await Deliver.destroy({
            where: {
                deliverId: req.params.deliverId
            }
        });
        res.json({
            "message": "Accounting Deleted"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}

export const getAllCurrencies = async (req, res) => {
    try {
        const accounts = await Currencies.findAll();
        res.json(accounts);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const updateCurrencies = async (req, res) => {
    try {
        const errors = [];

        // Проверяем на наличие ошибок
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors });
        }

        // Обрабатываем каждую запись в теле запроса
        const accounts = req.body;

        for (const account of accounts) {
            if (account.id) {
                // Обновляем существующую запись
                await Currencies.update(account, { where: { id: account.id } });
            } else {
                // Создаем новую запись
                await Currencies.create(account);
            }
        }

        // Получаем все актуальные записи из БД
        const allAccounts = await Currencies.findAll();
        
        res.json({
            allAccounts
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 

 
export const deleteCurrency = async (req, res) => {
    try {
        await Currencies.destroy({
            where: {
                id: req.params.id
            }
        });
        res.json({
            "message": "Currency Deleted"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}