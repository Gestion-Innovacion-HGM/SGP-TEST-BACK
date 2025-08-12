import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

export function NoSpacesBetween(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'noSpacesBetween',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          return !/\s/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} no debe contener espacios entre caracteres.`;
        },
      },
    });
  };
}
