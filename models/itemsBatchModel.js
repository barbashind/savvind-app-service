import { Sequelize } from "sequelize";
import db from "../config/database.js";
import { Warehouses } from "./settingsModel.js";
 
const { DataTypes } = Sequelize;
 
const ItemBatch = db.define('items_batch',{
    itemBatchId:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    itemId:{
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    batchId:{
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    batchNumber:{
        type: DataTypes.INTEGER
    },
    name:{
        type: DataTypes.STRING
    },
    costPrice:{
        type: DataTypes.INTEGER
    },
    costPriceAll:{
        type: DataTypes.INTEGER
    },
    hasSerialNumber:{
        type: DataTypes.BOOLEAN
    },
    serialNumber:{
        type: DataTypes.STRING
    },
    quant:{
        type: DataTypes.INTEGER
    },
    quantFinal:{
        type: DataTypes.INTEGER
    },
    isSaled: {
        type: DataTypes.BOOLEAN
    },
    remainder:{
        type: DataTypes.INTEGER
    },
    costDeliver:{
        type: DataTypes.INTEGER
    },
    contractorId:{
        type: DataTypes.INTEGER
    },
    warehouse:{
        type: DataTypes.STRING
    },
    partner:{
        type: DataTypes.STRING
    },
    createdAt:{
        type: DataTypes.DATE
    },
    updatedAt:{
        type: DataTypes.DATE
    },

},{
    freezeTableName: true
});
 
export default ItemBatch;