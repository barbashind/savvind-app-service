import { Sequelize } from "sequelize";
import db from "../config/database.js";
 
const { DataTypes } = Sequelize;
 
const Deliver = db.define('delivers',{
    
    deliverId:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name:{
        type: DataTypes.STRING
    },
    priceDeliver:{
        type: DataTypes.STRING
    },
    insurance:{
        type: DataTypes.BOOLEAN
    },

},{
    freezeTableName: true
});
 
export default Deliver;