import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator'

@ValidatorConstraint({ name: 'isEcuadorRuc', async: false })
export class IsEcuadorRucConstraint implements ValidatorConstraintInterface {
  validate(ruc: string): boolean {
    if (!/^\d{13}$/.test(ruc)) return false

    const province = Number(ruc.substring(0, 2))
    if (province < 1 || province > 24) {
      return false
    }

    const thirdDigit = Number(ruc[2])

    // Persona natural
    if (thirdDigit >= 0 && thirdDigit <= 5) {
      if (!this.validateNaturalPerson(ruc.substring(0, 10))) {
        return false
      }

      return ruc.substring(10) === '001'
    }

    // Sociedad pública
    if (thirdDigit === 6) {
      return this.validatePublicEntity(ruc)
    }

    // Sociedad privada
    if (thirdDigit === 9) {
      return this.validatePrivateEntity(ruc)
    }

    return false
  }

  defaultMessage(args: ValidationArguments) {
    return 'El RUC ecuatoriano no es válido'
  }

  private validateNaturalPerson(cedula: string): boolean {
    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]

    let total = 0

    for (let i = 0; i < 9; i++) {
      let value = Number(cedula[i]) * coefficients[i]

      if (value >= 10) {
        value -= 9
      }

      total += value
    }

    const verifier = (10 - (total % 10)) % 10

    return verifier === Number(cedula[9])
  }

  private validatePrivateEntity(ruc: string): boolean {
    const coeffs = [4, 3, 2, 7, 6, 5, 4, 3, 2]

    let sum = 0

    for (let i = 0; i < 9; i++) {
      sum += Number(ruc[i]) * coeffs[i]
    }

    const verifier = 11 - (sum % 11)
    const digit = verifier === 11 ? 0 : verifier

    return digit === Number(ruc[9]) && ruc.substring(10) === '001'
  }

  private validatePublicEntity(ruc: string): boolean {
    const coeffs = [3, 2, 7, 6, 5, 4, 3, 2]

    let sum = 0

    for (let i = 0; i < 8; i++) {
      sum += Number(ruc[i]) * coeffs[i]
    }

    const verifier = 11 - (sum % 11)
    const digit = verifier === 11 ? 0 : verifier

    return digit === Number(ruc[8]) && ruc.substring(9) === '001'
  }
}
