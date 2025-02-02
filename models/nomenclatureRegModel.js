import { Sequelize } from "sequelize";
import db from "../config/database.js";
 
const { DataTypes } = Sequelize;
 
const NomenclatureReg = db.define('nomenclature',{
    itemId:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name:{
        type: DataTypes.STRING
    },
    weight:{
        type: DataTypes.INTEGER
    },
    productHeight: {
        type: DataTypes.INTEGER
    },
    productWidth: {
        type: DataTypes.INTEGER
    },
    productLength: {
        type: DataTypes.INTEGER
    },
    createdAt:{
        type: DataTypes.DATE
    },
    updatedAt:{
        type: DataTypes.DATE
    },
    remains:{
        type: DataTypes.INTEGER
    },
    isMessageActive:{
        type: DataTypes.BOOLEAN
    },
    productType:{
        type: DataTypes.STRING
    },
    brand:{
        type: DataTypes.STRING
    },
    altName:{
        type: DataTypes.STRING
    },
    productColor:{
        type: DataTypes.STRING
    },
    productPrice:{
        type: DataTypes.INTEGER
    },
    printName:{
        type: DataTypes.STRING
    },
    productModel:{
        type: DataTypes.STRING
    },
    productMemory:{
        type: DataTypes.STRING
    },
    productCountry:{
        type: DataTypes.STRING
    },
    productSim:{
        type: DataTypes.STRING
    },
    remainsSum:{
        type: DataTypes.INTEGER
    },
    hasSerialNumber:{
        type: DataTypes.BOOLEAN
    },
},{
    freezeTableName: true
});
 
export default NomenclatureReg;