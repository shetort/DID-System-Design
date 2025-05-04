
const logger = require('../utils/Logger');

exports.getLogs = async (req, res) => {
    try {
        const logs = await logger.getLogs();
        res.status(200).json({
            message: 'VC registered successfully',
            logs
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to register VC', error: error.message });
    }
};
