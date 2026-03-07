import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./pages/DashboardPage", () => function DashboardPageMock() {
  return <div>AI Emotion Analytics Dashboard</div>;
});

jest.mock("axios", () => ({
  create: () => ({
    interceptors: {
      response: { use: jest.fn() },
    },
    post: jest.fn(() => Promise.resolve({ data: {} })),
    get: jest.fn(() => Promise.resolve({ data: {} })),
  }),
}));

test("renders emotion analytics dashboard heading", () => {
  render(<App />);
  const headingElement = screen.getByText(/ai emotion analytics dashboard/i);
  expect(headingElement).toBeInTheDocument();
});
