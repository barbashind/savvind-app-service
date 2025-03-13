import { Sequelize } from "sequelize";
import db from "../config/database.js";
 
const { DataTypes } = Sequelize;
 
const CheckType = db.define('receipts',{
    checkId:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    summ:{
        type: DataTypes.INTEGER
    },
    customer:{
        type: DataTypes.STRING
    },
    isBooking:{
        type: DataTypes.BOOLEAN
    },
    isUnpaid:{
        type: DataTypes.BOOLEAN
    },
    isCancelled:{
        type: DataTypes.BOOLEAN
    },
    seller: {
        type: DataTypes.STRING
    },
    courier:{
        type: DataTypes.STRING
    },
    account:{
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
 
export default CheckType;