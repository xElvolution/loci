import { render, screen } from "@testing-library/react-native";
import { Wordmark } from "@/components/Wordmark";

describe("Wordmark", () => {
  it("renders the accessible loci mark", async () => {
    await render(<Wordmark width={120} animated={false} />);
    expect(await screen.findByLabelText("loci")).toBeTruthy();
  });
});
