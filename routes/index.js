import express from "express";
import jwt from 'jsonwebtoken';

import { 
        getNomenclatureById,
        createNomenclature,
        updateNomenclature,
        deleteNomenclature,
        nomenclatureFilter,
        getNomenclatureAll,
        getProductsFile,
        updateNomenclatureRemains,
        getItemsStatById
    } from "../controllers/Nomenclature.js";
import { createProductType, deleteProductType, getAllProductTypes, getProductTypeByLabel, updateProductType } from "../controllers/ProductTypes.js";
import { createBatch, deleteBatch, getBatchById, getBatchByNumber, purchaseFilter, updateBatch } from "../controllers/Batches.js";
import { changeWarehouseItem, changeWarehouseItemSerialNum, createItemsBatch, deleteItemBatch, deleteItemsBatch, getItemsBatchById, getItemsBatchByNumber, getItemsBatchFilter, getItemsBatchForReturn, getItemsBatchRegById, returnItemBatch, updateItemsBatch } from "../controllers/ItemsBatch.js";
import { getAllBatchesReg, getBatchRegById } from "../controllers/BatchesReg.js";
import { createCheck, deleteCheck, getAllCheckes, getCheckById, getProductBySerialNumber, getSalesDebt, updateCheck } from "../controllers/Checkes.js";
import { getAllDelivers } from "../controllers/Delivers.js";
import { createItemsCheck, getAllItemsCheck, getAnalyticProd, getAssets, getDeliversAnalytics, getItemsCheckById, getItemsCheckBySerial, getItemsCheckToReturn, getRevenueAndProfit, getRevenueAndProfitGraph, restoreItemsCheck } from "../controllers/ItemsCheck.js";
import { getAllContractors } from "../controllers/Contractors.js";
import { accountingFilter, accountingSumm, createAccounting, deleteAccounting, getAccountingByBatch, getAccountingById, getAccountingByNewBatch, updateAccounting } from "../controllers/Accountings.js";
import { deleteAccount, deleteCategory, deleteContractor, deleteCurrency, deleteDeliver, deleteUser, deleteWarehouse, getAllAccounts, getAllCategories, getAllCurrencies, getAllUsers, getAllWarehouses, updateAccounts, updateCategories, updateContractors, updateCurrencies, updateDelivers, updateUsers, updateWarehouses } from "../controllers/Settings.js";
 
const router = express.Router();

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Извлечение токена из заголовка

    if (!token) {
        return res.status(401).json({ valid: false, message: 'Токен отсутствует' }); // Токен отсутствует
    }

    jwt.verify(token, 'secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ valid: false, message: 'Токен недействителен' }); // Токен недействителен
        }
        req.user = user; // Сохранение информации о пользователе в запросе
        next(); // Переход к следующему middleware или маршруту
    });
};

router.post('/api/nomenclature/filter',authenticateToken, nomenclatureFilter);
router.get('/api/nomenclature/all', authenticateToken, getNomenclatureAll);
router.get('/api/nomenclature/:itemId', authenticateToken, getNomenclatureById);
router.post('/api/create-nomenclature', authenticateToken, createNomenclature);
router.post('/api/upload-nomenclature', authenticateToken, getProductsFile);
router.post('/api/update-nomenclature/:itemId', authenticateToken, updateNomenclature);
router.post('/api/update-nomenclature-remains', authenticateToken, updateNomenclatureRemains);
router.delete('/api/delete-nomenclature/:itemId', authenticateToken, deleteNomenclature);

router.get('/api/productType/all', authenticateToken, getAllProductTypes);
router.get('/api/productType/:label', authenticateToken, getProductTypeByLabel);
router.post('/api/create-productType', authenticateToken, createProductType);
router.post('/api/update-productType/:id', authenticateToken, updateProductType);
router.delete('/api/delete-productType/:id', authenticateToken, deleteProductType);

router.post('/api/purchase/filter', authenticateToken, purchaseFilter);
router.get('/api/purchase-by-number/:batchNumber', authenticateToken, getBatchByNumber);
router.get('/api/purchase/:id', authenticateToken, getBatchById);
router.post('/api/create-purchase', authenticateToken, createBatch);
router.post('/api/update-purchase/:batchId', authenticateToken, updateBatch);
router.delete('/api/delete-purchase/:batchId', authenticateToken, deleteBatch);

router.post('/api/purchase-reg/filter', authenticateToken, getAllBatchesReg);
router.get('/api/purchase-reg-by-id/:id', authenticateToken, getBatchRegById);
router.get('/api/purchase-reg-by-id/update/:batchId', authenticateToken, getBatchRegById);
router.get('/api/items-purchase-reg/:id', authenticateToken, getItemsBatchRegById);

router.get('/api/items-batch/:batchId', authenticateToken, getItemsBatchById);
router.get('/api/items-batch/:batchNumber', authenticateToken, getItemsBatchByNumber);
router.post('/api/items-batch/filter', authenticateToken, getItemsBatchFilter);
router.post('/api/items-batch-return', authenticateToken, getItemsBatchForReturn);
router.post('/api/return-item-batch/:itemBatchId', authenticateToken, returnItemBatch);
router.post('/api/create-items-batch', authenticateToken, createItemsBatch);
router.post('/api/update-items-batch/:batchId', authenticateToken, updateItemsBatch);
router.delete('/api/delete-items-batch/:batchId', authenticateToken, deleteItemsBatch);
router.delete('/api/delete-item-batch/:itemBatchId', authenticateToken, deleteItemBatch);

router.post('/api/check/filter', authenticateToken, getAllCheckes);
router.post('/api/sales/filter', authenticateToken, getAllItemsCheck);
router.post('/api/sales-return/filter', authenticateToken, getItemsCheckToReturn);
router.get('/api/sale-by-id/:checkId', authenticateToken, getCheckById);
router.get('/api/sales-by-serial/:serialNumber', authenticateToken, getItemsCheckBySerial);
router.get('/api/sales-by-id/:checkId', authenticateToken, getItemsCheckById);
router.post('/api/create-check', authenticateToken, createCheck);
router.post('/api/update-check/:checkId', authenticateToken, updateCheck);
router.post('/api/create-items-check', authenticateToken, createItemsCheck);
router.get('/api/product-by-serial/:serialNumber', authenticateToken, getProductBySerialNumber);
router.delete('/api/check-delete/:checkId', authenticateToken, deleteCheck);
router.delete('/api/check-items-delete/:checkId', authenticateToken, restoreItemsCheck);
router.get('/api/sales-dept', authenticateToken, getSalesDebt);

router.post('/api/accounting/filter', authenticateToken, accountingFilter);
router.post('/api/accounting/summs', authenticateToken, accountingSumm);
router.get('/api/accounting/:id', authenticateToken, getAccountingById);
router.post('/api/create-accounting', authenticateToken, createAccounting);
router.post('/api/update-accounting/:id', authenticateToken, updateAccounting);
router.delete('/api/delete-accounting/:id', authenticateToken, deleteAccounting);
router.post('/api/accounting/find-by-batch', authenticateToken, getAccountingByBatch);
router.post('/api/accounting/find-by-new-batch', authenticateToken, getAccountingByNewBatch);

router.get('/api/accounts/all', authenticateToken, getAllAccounts);
router.post('/api/update-accounts', authenticateToken, updateAccounts);
router.delete('/api/delete-account/:accountId', authenticateToken, deleteAccount);

router.get('/api/categories/all', authenticateToken, getAllCategories);
router.post('/api/update-categories', authenticateToken, updateCategories);
router.delete('/api/delete-category/:id', authenticateToken, deleteCategory);

router.get('/api/users/all', authenticateToken, getAllUsers);
router.post('/api/update-users', authenticateToken, updateUsers);
router.delete('/api/delete-user/:id', authenticateToken, deleteUser);

router.get('/api/delivers/filter', authenticateToken, getAllDelivers);
router.get('/api/contractors/filter', authenticateToken, getAllContractors);
router.post('/api/update-contractors', authenticateToken, updateContractors);
router.delete('/api/delete-contractor/:contractorId', authenticateToken, deleteContractor);
router.post('/api/update-delivers', authenticateToken, updateDelivers);
router.delete('/api/delete-deliver/:deliverId', authenticateToken, deleteDeliver);

router.get('/api/warehouses/all', authenticateToken, getAllWarehouses);
router.post('/api/update-warehouses', authenticateToken, updateWarehouses);
router.delete('/api/delete-warehouse/:warehouseId', authenticateToken, deleteWarehouse);

router.get('/api/currencies/all', authenticateToken, getAllCurrencies);
router.post('/api/update-currencies', authenticateToken, updateCurrencies);
router.delete('/api/delete-currency/:id', authenticateToken, deleteCurrency);

router.post('/api/change-warehouse-by-serial-num', authenticateToken, changeWarehouseItemSerialNum);
router.post('/api/change-warehouse-by-name', authenticateToken, changeWarehouseItem);

router.post('/api/analytic-by-users', authenticateToken, getRevenueAndProfit);
router.post('/api/analytic-graph', authenticateToken, getRevenueAndProfitGraph);
router.post('/api/analytic-assets', authenticateToken, getAssets);
router.post('/api/analytic-prod/filter', authenticateToken, getAnalyticProd);
router.get('/api/analytic-delivers', authenticateToken, getDeliversAnalytics);

router.get('/api/nomenclature-stat/:itemId', authenticateToken, getItemsStatById);

export default router;