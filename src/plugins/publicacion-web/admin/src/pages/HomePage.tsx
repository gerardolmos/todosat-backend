import {
  Box,
  Button,
  Flex,
  Main,
  Typography,
} from "@strapi/design-system";

const HomePage = () => {
  return (
    <Main>
      <Box padding={8}>
        <Flex
          direction="column"
          alignItems="stretch"
          gap={6}
        >
          <Flex
            direction="column"
            alignItems="flex-start"
            gap={2}
          >
            <Typography variant="alpha" tag="h1">
              Publicar cambios en la web
            </Typography>

            <Typography textColor="neutral600">
              Actualiza la web pública con todos los
              contenidos publicados actualmente en Strapi.
            </Typography>
          </Flex>

          <Box
            background="neutral0"
            padding={6}
            hasRadius
            shadow="filterShadow"
          >
            <Flex
              direction="column"
              alignItems="flex-start"
              gap={4}
            >
              <Typography variant="beta" tag="h2">
                Publicación del sitio
              </Typography>

              <Typography textColor="neutral600">
                Utiliza esta acción cuando hayas terminado
                de editar y publicar los contenidos del día.
              </Typography>

              <Button disabled>
                Publicar cambios en la web
              </Button>

              <Typography
                variant="pi"
                textColor="neutral600"
              >
                Conexión con Netlify pendiente.
              </Typography>
            </Flex>
          </Box>
        </Flex>
      </Box>
    </Main>
  );
};

export { HomePage };
