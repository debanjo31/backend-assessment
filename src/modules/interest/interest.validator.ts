import Joi from 'joi';

const options = {
    errors: {
        wrap: {
            label: '',
        },
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateCreateLoan = (data: any) => {
    const schema = Joi.object({
        principal: Joi.number().positive().precision(4).required().messages({
            'number.positive': 'Principal must be a positive number',
            'any.required': 'Principal is required',
        }),
        annual_rate: Joi.number()
            .positive()
            .precision(6)
            .default(27.5)
            .messages({
                'number.positive': 'Annual rate must be a positive number',
            }),
        start_date: Joi.string()
            .pattern(/^\d{4}-\d{2}-\d{2}$/)
            .required()
            .custom((value, helpers) => {
                const today = new Date().toISOString().split('T')[0];
                if (value < today) {
                    return helpers.error('date.min');
                }
                return value;
            })
            .messages({
                'string.pattern.base':
                    'Start date must be in YYYY-MM-DD format',
                'any.required': 'Start date is required',
                'date.min': 'Start date cannot be in the past',
            }),
    });

    return schema.validate(data, options);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateAccrueInterest = (data: any) => {
    const schema = Joi.object({
        end_date: Joi.string()
            .pattern(/^\d{4}-\d{2}-\d{2}$/)
            .required()
            .messages({
                'string.pattern.base': 'End date must be in YYYY-MM-DD format',
                'any.required': 'End date is required',
            }),
    });

    return schema.validate(data, options);
};
