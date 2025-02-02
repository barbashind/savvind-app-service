import { Sequelize } from "sequelize";
import db from "../config/database.js";
 
const { DataTypes } = Sequelize;
 
const BatchReg = db.define('batches',{
    batchId:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    batchNumber:{
        type: DataTypes.INTEGER
    },
    comment:{
        type: DataTypes.STRING
    },
    createdAt:{
        type: DataTypes.DATE
    },
    updatedAt:{
        type: DataTypes.DATE
    },
    batchStatus:{
        type: DataTypes.STRING
    },

},{
    freezeTableName: true
});
 
export default BatchReg;