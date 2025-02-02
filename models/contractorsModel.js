import { Sequelize } from "sequelize";
import db from "../config/database.js";
 
const { DataTypes } = Sequelize;
 
const Contractor = db.define('contractors',{
    
    contractorId:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    contractor:{
        type: DataTypes.STRING
    },
    account: {
        type: DataTypes.STRING
    }
},{
    freezeTableName: true
});
 
export default Contractor;