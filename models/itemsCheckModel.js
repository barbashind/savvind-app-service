import { Sequelize } from "sequelize";
import db from "../config/database.js";
 
const { DataTypes } = Sequelize;
 
const ItemCheck = db.define('sales',{
    itemId:{
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    checkId:{
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    saleId:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    price:{
        type: DataTypes.INTEGER
    },
    name:{
        type: DataTypes.STRING
    },
    salePrice:{
        type: DataTypes.INTEGER
    },
    costPrice:{
        type: DataTypes.INTEGER
    },
    customer:{
        type: DataTypes.STRING
    },
    serialNumber:{
        type: DataTypes.STRING
    },
    batchId:{
        type: DataTypes.INTEGER,
    },
    partner: {
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
 
export default ItemCheck;