import {
  ListDetail,
  ListDetailDetail,
  ListDetailDetailContent,
  ListDetailDetailHeader,
  ListDetailEmpty,
  ListDetailList,
  ListDetailListContent,
  ListDetailListHeader,
  ListDetailRow,
  useListDetail,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/ListDetail",
  component: ListDetail,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ListDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

const items = [
  {
    id: "1",
    title: "Sarah Chen",
    preview: "Takk for sist – kan vi ta et møte?",
  },
  { id: "2", title: "Marcus Lee", preview: "Sendte over tilbudet i går." },
  { id: "3", title: "Nina Berg", preview: "Ser bra ut, jeg signerer i dag." },
];

function Detail() {
  const { value } = useListDetail();
  const item = items.find((i) => i.id === value);
  if (!item) return null;
  return (
    <>
      <ListDetailDetailHeader>
        <p className="font-semibold">{item.title}</p>
      </ListDetailDetailHeader>
      <ListDetailDetailContent>
        <p className="text-sm text-muted-foreground">{item.preview}</p>
      </ListDetailDetailContent>
    </>
  );
}

/**
 * Gjenbrukbar to-panel master/detalj-shell (e-postklient-stil). Desktop viser
 * begge paneler; på mobil åpnes detaljen i et Sheet-overlay. Brukes til
 * kurs-leksjoner og framtidig medlemschat.
 */
export const Default: Story = {
  render: () => (
    <div className="h-[480px] p-4">
      <ListDetail defaultValue="1" className="h-full">
        <ListDetailList>
          <ListDetailListHeader>
            <span className="text-sm font-medium">Innboks</span>
          </ListDetailListHeader>
          <ListDetailListContent>
            {items.map((item) => (
              <ListDetailRow key={item.id} value={item.id}>
                <span className="font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">
                  {item.preview}
                </span>
              </ListDetailRow>
            ))}
          </ListDetailListContent>
        </ListDetailList>
        <ListDetailDetail
          empty={
            <ListDetailEmpty>
              <p className="text-sm">Velg en rad for å se detaljer.</p>
            </ListDetailEmpty>
          }
        >
          <Detail />
        </ListDetailDetail>
      </ListDetail>
    </div>
  ),
};
