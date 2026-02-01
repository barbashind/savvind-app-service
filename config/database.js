import { Sequelize } from "sequelize";
 
// const db = new Sequelize('savvvin_db', 'root', 'kikakoka!', {
//     host: "db",
//     dialect: "mysql",
//     port: 3307,
// });

const db = new Sequelize('savvin_db', 'savvind', 'Rhbcnbyf2001!@', {
    host: "37.252.13.118",
    dialect: "mysql",
    port: 3306,
});
 
// export default db;
// const db = new Sequelize('savvin_copy_db', 'savvind', 'Rhbcnbyf2001!@', {
//     host: "78.107.239.94",
//     dialect: "mysql",
//     port: 3306,
// });
 
export default db;
