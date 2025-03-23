import { useState } from "react";
import { Button, Rows, Text, TextInput, Select } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import { FormattedMessage, useIntl } from "react-intl";
import * as styles from "styles/components.css";
import { useAddElement } from "utils/use_add_element";

export const DOCS_URL = "https://www.canva.dev/docs/apps/";

export const App = () => {
  const intl = useIntl();
  const addElement = useAddElement();

  const [businessId, setBusinessId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const username = `global/${email}`;

  const fetchBranches = async () => {
    setError("");
    setLoading(true);
    const cleanBusinessId = businessId.trim();

    try {
      const res = await fetch("http://localhost:4000/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: cleanBusinessId,
          username,
          password,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch branches");
      }

      const data = await res.json();
      setBranches(data);
    } catch (err) {
      console.error("Error fetching branches:", err);
      setError("Failed to fetch branches. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setError("");
    setLoading(true);
    const cleanBusinessId = businessId.trim();

    try {
      const res = await fetch("http://localhost:4000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: cleanBusinessId,
          username,
          password,
          branchId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to fetch reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const insertReview = async (text: string) => {
    await addElement({
      type: "text",
      children: [text],
    });
  };

  const openExternalUrl = async (url: string) => {
    const response = await requestOpenExternalUrl({ url });
    if (response.status === "aborted") {
      // user cancelled
    }
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text>
          <FormattedMessage
            defaultMessage="
              To make changes to this app, edit the <code>src/app.tsx</code> file,
              then close and reopen the app in the editor to preview the changes.
            "
            description="Instructions for how to make changes to the app. Do not translate <code>src/app.tsx</code>."
            values={{
              code: (chunks) => <code>{chunks}</code>,
            }}
          />
        </Text>

        {error && <Text tone="critical">{error}</Text>}

        <TextInput
          placeholder="Business ID"
          value={businessId}
          onChange={(value) => setBusinessId(value)}
        />
        <TextInput
          placeholder="Email (e.g. you@example.com)"
          value={email}
          onChange={(value) => setEmail(value)}
        />
        <TextInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(value) => setPassword(value)}
        />

        <Button onClick={fetchBranches} disabled={loading} stretch>
          Fetch Locations
        </Button>

        {branches.length > 0 && (
          <Select
            placeholder="Select a branch"
            value={branchId}
            onChange={(e) => setBranchId(e.currentTarget.value)}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        )}

        {branchId && (
          <Button onClick={fetchReviews} disabled={loading} stretch>
            Get Reviews
          </Button>
        )}

        {reviews.length > 0 && (
          <>
            <Text>
              {intl.formatMessage({
                defaultMessage: "Reviews:",
                description: "Heading for the list of reviews",
              })}
            </Text>

            {reviews.map((review) => (
              <div key={review.id}>
                <Text>
                  <strong>{review.client?.firstName || "Client"}:</strong>{" "}
                  {review.message}
                </Text>
                <Text>⭐ {review.rating}</Text>
                <Button
                  variant="secondary"
                  onClick={() => insertReview(review.message)}
                  stretch
                >
                  Insert into Design
                </Button>
              </div>
            ))}
          </>
        )}

        <Button
          variant="secondary"
          onClick={() => insertReview("Hello world!")}
          stretch
        >
          {intl.formatMessage({
            defaultMessage: "Insert Hello World",
            description: "Button that adds 'Hello world!' to the design.",
          })}
        </Button>

        <Button
          variant="secondary"
          onClick={() => openExternalUrl(DOCS_URL)}
          stretch
        >
          {intl.formatMessage({
            defaultMessage: "Open Canva Apps SDK docs",
            description: "Button text to open Canva Apps SDK docs.",
          })}
        </Button>
      </Rows>
    </div>
  );
};
