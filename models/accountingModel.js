import { Sequelize } from "sequelize";
import db from "../config/database.js";
 
const { DataTypes } = Sequelize;
 
const Accounting = db.define('accounting',{
    
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    accountFrom:{
        type: DataTypes.STRING
    },
    accountTo:{
        type: DataTypes.STRING
    },
    justification:{
        type: DataTypes.STRING
    },
    form:{
        type: DataTypes.STRING
    },
    value:{
        type: DataTypes.INTEGER
    },
    isDraft:{
        type: DataTypes.BOOLEAN
    },
    category:{
        type: DataTypes.STRING
    },
    currency:{
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
 
export default Accounting;