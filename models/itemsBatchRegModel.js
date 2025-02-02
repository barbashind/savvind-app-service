import { Sequelize } from "sequelize";
import db from "../config/database.js";
 
const { DataTypes } = Sequelize;
 
const ItemBatchReg = db.define('items_batch',{
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
    hasSerialNumber:{
        type: DataTypes.BOOLEAN
    },
    quant:{
        type: DataTypes.INTEGER
    },
    warehouse:{
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
 
export default ItemBatchReg;