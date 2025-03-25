import {
  Button,
  Rows,
  Text,
  TextInput,
  Select,
  Alert,
  Checkbox,
} from "@canva/app-ui-kit";
import { FormattedMessage, useIntl } from "react-intl";
import * as styles from "styles/components.css";
import { useAddElement } from "utils/use_add_element";
import React, { useState, useEffect } from "react";
import axios from "axios";

// API Configuration
const API_BASE_URL = process.env.PHOREST_API_URL || "https://api.phorest.com/api/v2";

interface SavedCredentials {
  businessId: string;
  email: string;
  password: string;
  rememberMe: boolean;
}

// Extend Window interface to include Canva types
declare global {
  interface Window {
    canva: {
      storage: {
        get: <T>(key: string) => Promise<T | null>;
        set: <T>(key: string, value: T) => Promise<void>;
        remove: (key: string) => Promise<void>;
      };
    };
  }
}

export const App = () => {
  const intl = useIntl();
  const addElement = useAddElement();

  const [businessId, setBusinessId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved credentials on component mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedCredentials = await window.canva.storage.get<SavedCredentials>("phorest_credentials");
        if (savedCredentials) {
          setBusinessId(savedCredentials.businessId);
          setEmail(savedCredentials.email);
          setPassword(savedCredentials.password);
          setRememberMe(savedCredentials.rememberMe);
          
          // If credentials are saved and remember me is true, automatically fetch branches
          if (savedCredentials.rememberMe) {
            await fetchBranches();
          }
        }
      } catch {
        // Ignore storage errors
      }
    };
    loadSavedCredentials();
  }, []);

  const saveCredentials = async () => {
    if (rememberMe) {
      try {
        await window.canva.storage.set("phorest_credentials", {
          businessId,
          email,
          password,
          rememberMe,
        });
      } catch {
        // Ignore storage errors
      }
    } else {
      try {
        await window.canva.storage.remove("phorest_credentials");
      } catch {
        // Ignore storage errors
      }
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateBusinessId = (id: string) => {
    // Phorest Business IDs are typically UUIDs
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };

  const fetchBranches = async () => {
    if (!validateBusinessId(businessId)) {
      setError(intl.formatMessage({
        defaultMessage: "Please enter a valid Business ID (UUID format)",
        description: "Invalid Business ID error message"
      }));
      return;
    }

    if (!validateEmail(email)) {
      setError(intl.formatMessage({
        defaultMessage: "Please enter a valid email address",
        description: "Invalid email error message"
      }));
      return;
    }

    if (!password) {
      setError(intl.formatMessage({
        defaultMessage: "Please enter your password",
        description: "Missing password error message"
      }));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/business/${businessId}/branch`,
        {
          auth: {
            username: `global/${email}`,
            password,
          },
        }
      );
      setBranches(response.data.branches);
      // Save credentials after successful authentication
      await saveCredentials();
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError(intl.formatMessage({
          defaultMessage: "Invalid credentials. Please check your Business ID, email, and password.",
          description: "Authentication error message"
        }));
      } else {
        setError(error.response?.data?.message || intl.formatMessage({
          defaultMessage: "Failed to fetch branches. Please try again.",
          description: "Generic error message"
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/business/${businessId}/review`,
        {
          params: {
            branchId,
            page: 0,
            size: 20,
          },
          auth: {
            username: `global/${email}`,
            password,
          },
        }
      );
      setReviews(response.data.reviews);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError(intl.formatMessage({
          defaultMessage: "Your session has expired. Please re-enter your credentials.",
          description: "Session expired error message"
        }));
      } else {
        setError(error.response?.data?.message || intl.formatMessage({
          defaultMessage: "Failed to fetch reviews. Please try again.",
          description: "Generic error message"
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const insertReview = (review: any) => {
    const reviewText = `"${review.message}"\n- ${review.client?.firstName || "Client"} (${review.rating} stars)`;
    addElement({
      type: "text",
      children: [reviewText],
    });
  };

  const loadingText = intl.formatMessage({
    defaultMessage: "Loading...",
    description: "Loading state text"
  });

  const fetchLocationsText = intl.formatMessage({
    defaultMessage: "Fetch Locations",
    description: "Fetch locations button text"
  });

  const fetchReviewsText = intl.formatMessage({
    defaultMessage: "Fetch Reviews",
    description: "Fetch reviews button text"
  });

  const insertReviewText = intl.formatMessage({
    defaultMessage: "Insert Review",
    description: "Insert review button text"
  });

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text>
          <FormattedMessage
            defaultMessage="Connect your Phorest account to display and insert salon reviews into your Canva designs."
            description="App description"
          />
        </Text>

        {error && (
          <Alert tone="critical">
            {error}
          </Alert>
        )}

        <TextInput
          placeholder={intl.formatMessage({
            defaultMessage: "Enter your Phorest Business ID (UUID format)",
            description: "Business ID input placeholder"
          })}
          value={businessId}
          onChange={setBusinessId}
          disabled={loading}
        />

        <TextInput
          placeholder={intl.formatMessage({
            defaultMessage: "Enter your Phorest account email",
            description: "Email input placeholder"
          })}
          value={email}
          onChange={setEmail}
          disabled={loading}
        />

        <TextInput
          placeholder={intl.formatMessage({
            defaultMessage: "Enter your Phorest account password",
            description: "Password input placeholder"
          })}
          value={password}
          type="text"
          onChange={setPassword}
          disabled={loading}
        />

        <Checkbox
          checked={rememberMe}
          onChange={(_, checked) => setRememberMe(checked)}
          label={intl.formatMessage({
            defaultMessage: "Remember my credentials",
            description: "Remember me checkbox label"
          })}
        />

        <Button
          variant="secondary"
          onClick={fetchBranches}
          disabled={loading || !businessId || !email || !password}
          stretch
        >
          {loading ? loadingText : fetchLocationsText}
        </Button>

        {branches.length > 0 && (
          <Select
            value={branchId}
            onChange={setBranchId}
            options={branches.map((branch) => ({
              label: branch.name,
              value: branch.id,
            }))}
            disabled={loading}
          />
        )}

        <Button
          variant="primary"
          onClick={fetchReviews}
          disabled={loading || !branchId}
          stretch
        >
          {loading ? loadingText : fetchReviewsText}
        </Button>

        {reviews.map((review) => (
          <div key={review.id} className={styles.reviewCard}>
            <Text>
              <FormattedMessage
                defaultMessage="{name}"
                description="Client name"
                values={{ name: review.client?.firstName || "Client" }}
              />
              <br />
              {review.message}
              <br />
              <FormattedMessage
                defaultMessage="{rating} stars"
                description="Review rating"
                values={{ rating: review.rating }}
              />
            </Text>
            <Button
              variant="secondary"
              onClick={() => insertReview(review)}
              disabled={loading}
            >
              {insertReviewText}
            </Button>
          </div>
        ))}

        {reviews.length === 0 && !loading && (
          <Text>
            <FormattedMessage
              defaultMessage="No reviews found. Try fetching reviews from a different location."
              description="Message shown when no reviews are found"
            />
          </Text>
        )}
      </Rows>
    </div>
  );
};
