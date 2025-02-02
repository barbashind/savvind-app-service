import Contractor from "../models/contractorsModel.js";

export const getAllContractors = async (req, res) => {
    try {
        const contractors = await Contractor.findAll();
        res.json(contractors);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
