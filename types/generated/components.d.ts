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

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'tienda.caracteristica-producto': TiendaCaracteristicaProducto;
    }
  }
}
