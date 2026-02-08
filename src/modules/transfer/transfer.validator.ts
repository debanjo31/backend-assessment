import Joi from 'joi';

const options = {
    errors: {
        wrap: {
            label: '',
        },
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateTransfer = (data: any) => {
    const schema = Joi.object({
        idempotency_key: Joi.string().required().messages({
            'any.required': 'Idempotency key is required',
            'string.empty': 'Idempotency key cannot be empty',
        }),
        receiver_id: Joi.string()
            .guid({ version: 'uuidv4' })
            .required()
            .messages({
                'string.guid': 'Receiver ID must be a valid UUID',
                'any.required': 'Receiver ID is required',
            }),
        amount: Joi.number().positive().precision(4).required().messages({
            'number.positive': 'Amount must be a positive number',
            'any.required': 'Amount is required',
        }),
    });

    return schema.validate(data, options);
};
