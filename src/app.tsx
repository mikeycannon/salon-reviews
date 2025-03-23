import React, { useState } from "react";
import {
  Button,
  Rows,
  Text,
  TextInput,
  Select,
} from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import { FormattedMessage, useIntl } from "react-intl";
import * as styles from "styles/components.css";
import { useAddElement } from "utils/use_add_element";

const DOCS_URL = "https://www.canva.dev/docs/apps/";

// Types
interface Branch {
  id: string;
  name: string;
}

interface Review {
  id: string;
  message: string;
  rating: number;
  client?: {
    firstName?: string;
  };
}

export const App = () => {
  const intl = useIntl();
  const addElement = useAddElement();

  const [businessId, setBusinessId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://your-render-backend-url.com/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, email, password }),
      });
      const data = await res.json();
      setBranches(data.branches);
    } catch (err) {
      console.error("Error fetching branches", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://your-render-backend-url.com/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, email, password, branchId }),
      });
      const data = await res.json();
      setReviews(data.reviews);
    } catch (err) {
      console.error("Error fetching reviews", err);
    } finally {
      setLoading(false);
    }
  };

  const insertReview = (text: string) => {
    addElement({ type: "text", children: [text] });
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text>
          <FormattedMessage
            defaultMessage="To make changes to this app, edit the <code>src/app.tsx</code> file, then close and reopen the app in the editor to preview the changes."
            description="Instructions for how to make changes to the app. Do not translate <code>src/app.tsx</code>."
            values={{ code: (chunks) => <code>{chunks}</code> }}
          />
        </Text>

        <TextInput
          placeholder="Business ID"
          value={businessId}
          onChange={(e) => setBusinessId(e.currentTarget.value)}
        />

        <TextInput
          placeholder="Email (e.g. you@example.com)"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />

        <Button
          variant="primary"
          onClick={fetchBranches}
          disabled={loading}
          stretch
        >
          Fetch Locations
        </Button>

        {branches.length > 0 && (
          <Select
            value={branchId}
            onChange={(e) => {
              const target = e.currentTarget as HTMLSelectElement;
              setBranchId(target.value);
            }}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        )}

        <Button
          variant="secondary"
          onClick={fetchReviews}
          disabled={loading || !branchId}
          stretch
        >
          Fetch Reviews
        </Button>

        {reviews.map((review) => (
          <div key={review.id}>
            <Text>
              <strong>{review.client?.firstName || "Client"}:</strong>{" "}
              {review.message}
            </Text>
            <Text>⭐ {review.rating}</Text>
            <Button
              variant="primary"
              onClick={() => insertReview(review.message)}
              stretch
            >
              Insert into Design
            </Button>
          </div>
        ))}

        <Button
          variant="tertiary"
          onClick={() => addElement({ type: "text", children: ["Hello world!"] })}
          stretch
        >
          Insert Hello World
        </Button>

        <Button
          variant="tertiary"
          onClick={() => requestOpenExternalUrl({ url: DOCS_URL })}
          stretch
        >
          Open Canva Apps SDK docs
        </Button>
      </Rows>
    </div>
  );
};
