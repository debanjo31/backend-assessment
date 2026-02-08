import Joi from 'joi';

const options = {
    errors: {
        wrap: {
            label: '',
        },
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateFundWallet = (data: any) => {
    const schema = Joi.object({
        amount: Joi.number().positive().precision(4).required().messages({
            'number.positive': 'Amount must be a positive number',
            'any.required': 'Amount is required',
        }),
    });

    return schema.validate(data, options);
};
