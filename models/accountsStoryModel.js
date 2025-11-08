import { Sequelize } from "sequelize";
import db from "../config/database.js";
 
const { DataTypes } = Sequelize;
 
const AccountsStory= db.define('audit_log',{
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    table_name:{
        type: DataTypes.STRING
    },
    action_type:{
        type: DataTypes.STRING
    },
    action_time:{
        type: DataTypes.DATE
    },
    user:{
        type: DataTypes.STRING
    },
    row_id:{
        type: DataTypes.INTEGER
    },
    old_value:{
        type: DataTypes.BOOLEAN
    },
    new_value:{
        type: DataTypes.STRING
    },
    field:{
        type: DataTypes.STRING
    },
    remainder_old:{
        type: DataTypes.NUMBER
    },
    remainder_new:{
        type: DataTypes.NUMBER
    },
    serialNumber:{
        type: DataTypes.STRING
    },
    
},{
    freezeTableName: true
});
 
export default AccountsStory;