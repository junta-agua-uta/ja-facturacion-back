import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, writeFileSync } from 'fs';
import { signLiquidacionCompraXml } from 'ec-sri-invoice-signer'; // ⬅️ Usar nueva función

@Injectable()
export class SignLiquidacionService {
  private readonly logger = new Logger(SignLiquidacionService.name);

  signXml(p12Buffer: Buffer, password: string, xmlContent: string): string {
    try {
      this.logger.debug(' Firmando liquidación de compra...');

      // Limpiar XML
      let xml = this.cleanXml(xmlContent);

      // Firmar con la función específica para liquidaciones
      const signedXml = signLiquidacionCompraXml(xml, p12Buffer, {
        pkcs12Password: password || '',
      });

      // Guardar para debug (opcional)
      if (process.env.NODE_ENV !== 'production') {
        const ruta = '.';
        writeFileSync(`${ruta}/liquidacion-original.xml`, xml);
        writeFileSync(`${ruta}/liquidacion-firmada.xml`, signedXml);
        this.logger.debug(` Archivos guardados en: ${ruta}/`);
      }

      this.logger.log('Liquidación firmada correctamente');
      return signedXml;

    } catch (error) {
      this.logger.error('Error al firmar:', error.message);
      throw new Error(`Error al firmar liquidación: ${error.message}`);
    }
  }

  private cleanXml(xml: string): string {
    xml = xml.replace(/\s+/g, ' ');
    xml = xml.trim();
    xml = xml.replace(/(?<=>)(\r?\n)|(\r?\n)(?=<\/)/g, '');
    xml = xml.trim();
    xml = xml.replace(/(?<=>)(\s*)/g, '');

    const firstLineEndIndex = xml.indexOf('\n');
    if (firstLineEndIndex !== -1) {
      const firstLine = xml.substring(0, firstLineEndIndex).trim();
      if (firstLine.length > 0) {
        const newFirstLine = '<?xml version="1.0" encoding="UTF-8"?>';
        xml = `${newFirstLine}\n${xml.substring(firstLineEndIndex + 1).trim()}`;
      }
    }

    return xml;
  }

  getP12Certificate(): Buffer {
    const p12Path = process.env.SIGNATURE_PATH || 
      (process.env.NODE_ENV === 'production'
        ? '/tmp/firmajunta.p12'
        : './firmajunta.p12');

    try {
      return readFileSync(p12Path);
    } catch (error) {
      throw new Error(
        `No se pudo cargar el certificado P12 desde ${p12Path}: ${error.message}`,
      );
    }
  }
}