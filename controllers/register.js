import { validateRegister } from "../schemas/register.js";

class RegisterController {
  constructor({ registerModel }) {
    this.registerModel = registerModel;
  }

  create = async (req, res) => {
    console.log(req.body)

    const result = validateRegister(req.body);

    console.log(result)
    if (!result.success) {
      res.status(422).json({ error: JSON.parse(result.error.message) });
    }

    try {
      const data = await this.registerModel.create({
        id: crypto.randomUUID(),
        input: result.data,
      });

      res.status(201).json(data);
    } catch (error) {
      res
        .status(error.status || 500)
        .json({ error: error.error, type: error.type, field: error.field, details: error.details});
    }
  };
}

export { RegisterController };
