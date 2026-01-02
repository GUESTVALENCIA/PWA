const renderService = require('../services/render.service');

class RenderController {

    async listServices(req, res, next) {
        try {
            const services = await renderService.getServices();
            res.json(services);
        } catch (error) {
            next(error);
        }
    }

    async listDeployments(req, res, next) {
        try {
            const { serviceId } = req.params;
            const deployments = await renderService.getDeployments(serviceId);
            res.json(deployments);
        } catch (error) {
            next(error);
        }
    }

    async triggerDeploy(req, res, next) {
        try {
             const { serviceId } = req.params;
             const { clearCache } = req.body;
             const result = await renderService.triggerDeploy(serviceId, clearCache);
             res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RenderController();
