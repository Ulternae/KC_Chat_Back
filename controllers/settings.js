import { partialValidateSettings } from "../schemas/settings.js"

class SettingsController {
  
  constructor({ settingsModel}) {
    this.settingsModel = settingsModel
  }

  updateSettings = async (req, res) => {
    const result = partialValidateSettings(req.body)

    if (!result.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message) });
    }

    try {
      const data = await this.settingsModel.updateSettings({ settings: result.data, user: req.user})
      res.json(data)
    } catch (error) {
      console.log(error)
    }
  }
}

export { SettingsController }