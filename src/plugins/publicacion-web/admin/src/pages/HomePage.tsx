import { useState } from "react";

import {
  Page,
  useAPIErrorHandler,
  useFetchClient,
  useNotification,
} from "@strapi/strapi/admin";

import {
  Box,
  Button,
  Flex,
  Main,
  Typography,
} from "@strapi/design-system";

const HomePage = () => {
  const [isPublishing, setIsPublishing] = useState(false);

  const { post } = useFetchClient();
  const { formatAPIError } = useAPIErrorHandler();
  const { toggleNotification } = useNotification();

  const handlePublish = async () => {
    if (isPublishing) {
      return;
    }

    setIsPublishing(true);

    try {
      await post("/publicacion-web/publish");

      toggleNotification({
        type: "success",
        message: "Publicación solicitada correctamente.",
      });
    } catch (error) {
      toggleNotification({
        type: "danger",
        message: formatAPIError(
          error as Parameters<typeof formatAPIError>[0],
        ),
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Main>
      <Page.Title>
        Publicar cambios en la web
      </Page.Title>

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

              <Button
                onClick={handlePublish}
                loading={isPublishing}
                disabled={isPublishing}
              >
                {isPublishing
                  ? "Publicando..."
                  : "Publicar cambios en la web"}
              </Button>

              <Typography
                variant="pi"
                textColor="neutral600"
              >
                La publicación solo se ejecutará cuando
                Netlify esté configurado en el servidor.
              </Typography>
            </Flex>
          </Box>
        </Flex>
      </Box>
    </Main>
  );
};

export { HomePage };
