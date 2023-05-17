import { Meta } from "@storybook/react";
import { QuickAction, QuickActions } from "../src/components/QuickActions";
import { colors } from "../src/constants/design";
import { StoryBlock, StoryPart } from "./_StoriesComponents";

export default {
  title: "Interactivity/QuickActions",
  component: QuickActions,
} as Meta<typeof QuickActions>;

const actions: QuickAction[] = [
  {
    icon: "building-bank-regular",
    label: "Bank",
    onPress: () => console.log("Click on Bank"),
  },
  {
    icon: "database-regular",
    label: "Database",
    onPress: () => console.log("Click on Database"),
    backgroundColor: colors.positive.primary,
    color: colors.positive.contrast,
  },
  {
    icon: "document-regular",
    label: "Document",
    disabled: true,
    onPress: () => console.log("Click on Document"),
    backgroundColor: colors.live.primary,
    color: colors.live.contrast,
  },
  {
    icon: "desktop-regular",
    label: "Desktop",
    onPress: () => console.log("Click on Desktop"),
    isLoading: true,
    backgroundColor: colors.sandbox.primary,
    color: colors.sandbox.contrast,
  },
];

export const Default = () => {
  return (
    <StoryBlock title="QuickActions">
      <StoryPart title="Without any action">
        <QuickActions actions={[]} />
      </StoryPart>

      <StoryPart title="Without 1 action">
        <QuickActions actions={actions.slice(0, 1)} />
      </StoryPart>

      <StoryPart title="Without several actions">
        <QuickActions actions={actions} />
      </StoryPart>

      <StoryPart title="With tooltip">
        <QuickActions actions={actions} tooltipText="Actions" />
      </StoryPart>

      <StoryPart title="With tooltip disabled">
        <QuickActions actions={actions} tooltipText="Actions" tooltipDisabled={true} />
      </StoryPart>
    </StoryBlock>
  );
};
