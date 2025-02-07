import { Sequelize } from "sequelize";
import db from "../config/database.js";
 
const { DataTypes } = Sequelize;
 
const Users = db.define('users',{
    
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username:{
        type: DataTypes.STRING
    },
    role:{
        type: DataTypes.STRING
    }

},{
    freezeTableName: true
});
 
export default Users;

export const Accounts = db.define('accounts',{
    
    accountId :{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name :{
        type: DataTypes.STRING
    },
    value: {
        type: DataTypes.INTEGER
    },
    currency: {
        type: DataTypes.STRING
    }
},{
    freezeTableName: true
});

export const Categories = db.define('categories',{
    
    id :{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name :{
        type: DataTypes.STRING
    },

},{
    freezeTableName: true
});

export const Warehouses = db.define('warehouses',{
    
    warehouseId :{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name :{
        type: DataTypes.STRING
    },

},{
    freezeTableName: true
});

export const Currencies = db.define('currencies',{
    
    id :{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    currency :{
        type: DataTypes.STRING
    },

},{
    freezeTableName: true
});