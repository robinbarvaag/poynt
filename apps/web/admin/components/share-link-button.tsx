"use client";

import {
  Button,
  Popup,
  PopupList,
  toast,
  useDocumentInfo,
  useFormFields,
} from "@payloadcms/ui";
import { getPublicUrl } from "../../lib/public-path";
import { SHARE_CHANNELS, buildShareUrl } from "../../lib/share-link";

/**
 * «Del-lenke» i dokument-headeren: velg hvor du skal dele, få en UTM-merket
 * lenke i utklippstavla. Da ser vi i Vercel Analytics («UTM Parameters»)
 * hvilken kanal som faktisk ga besøk. Logikken ligger i lib/share-link.ts.
 * Montert via `admin.components.edit.beforeDocumentControls`.
 */
export function ShareLinkButton() {
  const { collectionSlug, id, docConfig, hasPublishedDoc } = useDocumentInfo();
  const slug = useFormFields(
    ([fields]) => fields?.slug?.value as string | undefined
  );

  if (!id || !collectionSlug) return null;
  const pageUrl = getPublicUrl(collectionSlug, slug);
  if (!pageUrl) return null;

  const hasDrafts = Boolean(
    docConfig && "versions" in docConfig && docConfig.versions?.drafts
  );
  const unpublished = hasDrafts && !hasPublishedDoc;

  const copy = async (channelKey: string) => {
    const channel = SHARE_CHANNELS.find((c) => c.key === channelKey);
    if (!channel) return;
    const link = buildShareUrl(pageUrl, channel);
    try {
      await navigator.clipboard.writeText(link);
      if (unpublished) {
        toast.warning(
          "Lenken er kopiert, men siden er ikke publisert ennå – den virker først når du publiserer."
        );
      } else {
        toast.success(`Lenke til ${channel.label} er kopiert – lim den inn.`);
      }
    } catch {
      toast.error(`Fikk ikke kopiert. Kopier lenken selv: ${link}`);
    }
  };

  return (
    <Popup
      buttonType="custom"
      horizontalAlign="right"
      size="large"
      button={
        <Button
          el="span"
          buttonStyle="secondary"
          size="medium"
          margin={false}
          extraButtonProps={{ title: "Kopier lenke for deling" }}
        >
          Del-lenke
        </Button>
      }
      render={({ close }) => (
        <PopupList.ButtonGroup>
          <PopupList.GroupLabel label="Hvor skal du dele?" />
          {SHARE_CHANNELS.map((channel) => (
            <PopupList.Button
              key={channel.key}
              onClick={() => {
                close();
                void copy(channel.key);
              }}
            >
              <span className="share-link-option">
                <strong>{channel.label}</strong>
                <span>{channel.hint}</span>
              </span>
            </PopupList.Button>
          ))}
          <style>{`
            .share-link-option {
              display: flex;
              flex-direction: column;
              gap: 2px;
              text-align: left;
            }
            .share-link-option span {
              color: var(--theme-elevation-600);
              font-size: 12px;
            }
          `}</style>
        </PopupList.ButtonGroup>
      )}
    />
  );
}
