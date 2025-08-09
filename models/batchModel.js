import { Sequelize } from "sequelize";
import db from "../config/database.js";
 
const { DataTypes } = Sequelize;
 
const Batch = db.define('batches',{
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
    sum:{
        type: DataTypes.INTEGER
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
    costDeliver:{
        type: DataTypes.INTEGER
    },
    deliver:{
        type: DataTypes.INTEGER
    },
    insurance:{
        type: DataTypes.INTEGER
    },
    rate:{
        type: DataTypes.INTEGER
    },
    author: {
        type: DataTypes.STRING
    },
    isCalculated:{
        type: DataTypes.BOOLEAN
    }
},{
    freezeTableName: true
});
 
export default Batch;