import { Router } from "express"
import { authToken } from "../middlewares/authToken.js"
import { SettingsController } from "../controllers/settings.js"

const CreateSettingsRoute = ({ settingsModel }) => {
  const router = Router()
  const controller = new SettingsController({ settingsModel })

  router.patch('/' , authToken, controller.updateSettings)

  return router
}

export { CreateSettingsRoute }