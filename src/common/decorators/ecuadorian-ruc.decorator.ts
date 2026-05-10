import { registerDecorator, ValidationOptions } from 'class-validator'
import { IsEcuadorRucConstraint } from 'src/empresa/validators/is-ruc.validator'

export function IsEcuadorRuc(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsEcuadorRucConstraint,
    })
  }
}
