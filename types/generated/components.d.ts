import type { Schema, Struct } from '@strapi/strapi';

export interface TiendaCaracteristicaProducto extends Struct.ComponentSchema {
  collectionName: 'components_tienda_caracteristicas_producto';
  info: {
    description: '';
    displayName: 'Caracter\u00EDstica de producto de tienda';
  };
  attributes: {
    etiqueta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
        minLength: 1;
      }>;
    valor: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
        minLength: 1;
      }>;
  };
}

export interface TiendaDireccionEnvio extends Struct.ComponentSchema {
  collectionName: 'components_tienda_direcciones_envio';
  info: {
    description: 'Datos m\u00EDnimos necesarios para entregar un pedido';
    displayName: 'Direcci\u00F3n de env\u00EDo';
  };
  attributes: {
    ciudad: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    codigo_pais: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 2;
        minLength: 2;
      }> &
      Schema.Attribute.DefaultTo<'ES'>;
    codigo_postal: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 20;
      }>;
    linea_1: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 180;
      }>;
    linea_2: Schema.Attribute.String &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 180;
      }>;
    nombre_destinatario: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 120;
      }>;
    provincia: Schema.Attribute.String &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'tienda.caracteristica-producto': TiendaCaracteristicaProducto;
      'tienda.direccion-envio': TiendaDireccionEnvio;
    }
  }
}
