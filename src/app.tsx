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
import React, { useState } from "react";
import axios from "axios";

export const DOCS_URL = "https://www.canva.dev/docs/apps/";

export const App = () => {
  const intl = useIntl();
  const addElement = useAddElement();

  const [businessId, setBusinessId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const onClick = () => {
    addElement({
      type: "text",
      children: ["Hello world!"],
    });
  };

  const openExternalUrl = async (url: string) => {
    await requestOpenExternalUrl({ url });
  };

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://salonreviews.netlify.app/api/branches`,
        {
          auth: {
            username: `global/${email}`,
            password,
          },
          headers: {
            "phorest-api-key": "REPLACE_WITH_API_KEY",
            "phorest-business-id": businessId,
          },
        }
      );
      setBranches(response.data.branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://salonreviews.netlify.app/api/reviews?branchId=${branchId}`,
        {
          auth: {
            username: `global/${email}`,
            password,
          },
          headers: {
            "phorest-api-key": "REPLACE_WITH_API_KEY",
            "phorest-business-id": businessId,
          },
        }
      );
      setReviews(response.data.reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const insertReview = (message: string) => {
    addElement({
      type: "text",
      children: [message],
    });
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

        <TextInput
          placeholder="Business ID"
          value={businessId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setBusinessId(e.currentTarget.value)
          }
        />

        <TextInput
          placeholder="Email (e.g. you@example.com)"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.currentTarget.value)
          }
        />

        <TextInput
          placeholder="Password"
          value={password}
          type="text" // UI Kit doesn't support "password"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.currentTarget.value)
          }
        />

        <Button
          variant="secondary"
          onClick={fetchBranches}
          disabled={loading}
          stretch
        >
          Fetch Locations
        </Button>

        {branches.length > 0 && (
          <Select
            value={branchId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setBranchId(e.currentTarget.value)
            }
            options={branches.map((branch) => ({
              label: branch.name,
              value: branch.id,
            }))}
          />
        )}

        <Button
          variant="primary"
          onClick={fetchReviews}
          disabled={loading}
          stretch
        >
          Fetch Reviews
        </Button>

        {reviews.map((review) => (
          <div key={review.id}>
            <strong>{review.client?.firstName || "Client"}:</strong>{" "}
            {review.message}
            <Text>⭐ {review.rating}</Text>
            <Button
              variant="secondary"
              onClick={() => insertReview(review.message)}
            >
              Insert Review
            </Button>
          </div>
        ))}

        <Button variant="primary" onClick={onClick} stretch>
          {intl.formatMessage({
            defaultMessage: "Insert Hello World",
            description:
              "Button text to do something cool. Creates a new text element when pressed.",
          })}
        </Button>

        <Button
          variant="secondary"
          onClick={() => openExternalUrl(DOCS_URL)}
          stretch
        >
          {intl.formatMessage({
            defaultMessage: "Open Canva Apps SDK docs",
            description:
              "Button text to open Canva Apps SDK docs. Opens an external URL when pressed.",
          })}
        </Button>
      </Rows>
    </div>
  );
};
