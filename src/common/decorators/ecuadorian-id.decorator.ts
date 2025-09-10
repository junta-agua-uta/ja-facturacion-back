/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator'

@ValidatorConstraint({ async: false })
export class IsEcuadorianIdentityCardConstraint
  implements ValidatorConstraintInterface
{
  validate(identityCard: string, args: ValidationArguments) {
    // Implementa la lógica de validación para cédulas de identidad ecuatorianas
    if (identityCard.length !== 10) {
      return false
    }

    const digits = identityCard.split('').map(Number)
    const provinceCode = parseInt(identityCard.substring(0, 2), 10)
    const thirdDigit = digits[2]

    if (provinceCode < 1 || provinceCode > 24 || thirdDigit > 6) {
      return false
    }

    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    const total = digits.slice(0, 9).reduce((acc, digit, index) => {
      let product = digit * coefficients[index]
      if (product >= 10) {
        product -= 9
      }
      return acc + product
    }, 0)

    const checkDigit = total % 10 === 0 ? 0 : 10 - (total % 10)

    return checkDigit === digits[9]
  }

  defaultMessage(args: ValidationArguments) {
    return 'Cédula de identidad ecuatoriana no válida'
  }
}

export function IsEcuadorianIdentityCard(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEcuadorianIdentityCardConstraint,
    })
  }
}
