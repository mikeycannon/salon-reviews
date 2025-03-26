import {
  Button,
  Rows,
  Text,
  TextInput,
  Select,
  Alert,
  Checkbox,
  Stack,
} from "@canva/app-ui-kit";
import { FormattedMessage, useIntl } from "react-intl";
import * as styles from "../styles/components.css";
import { useAddElement } from "../utils/use_add_element";
import React, { useState, useEffect } from "react";
import axios from "axios";

// Supported salon software platforms
const SALON_PLATFORMS = [
  { id: 'phorest', name: 'Phorest' },
  { id: 'mindbody', name: 'Mindbody' },
  { id: 'boulevard', name: 'Boulevard' },
];

// API Configuration
const API_CONFIGS = {
  phorest: {
    baseUrl: "https://api-gateway-eu.phorest.com/third-party-api-server/api/business",
    authFormat: (email: string) => `global/${email}`,
    endpoints: {
      branches: (businessId: string) => `/${businessId}/branch`,
      reviews: (businessId: string, branchId: string) => `/${businessId}/branch/${branchId}/review`,
    },
  },
  mindbody: {
    baseUrl: "https://api.mindbodyonline.com/public/v6",
    authFormat: (email: string) => email,
    endpoints: {
      branches: (businessId: string) => `/business/${businessId}/locations`,
      reviews: (businessId: string, branchId: string) => `/business/${businessId}/location/${branchId}/reviews`,
    },
  },
  boulevard: {
    baseUrl: "https://api.boulevard.io/api/v1",
    authFormat: (email: string) => email,
    endpoints: {
      branches: (businessId: string) => `/businesses/${businessId}/locations`,
      reviews: (businessId: string, branchId: string) => `/businesses/${businessId}/locations/${branchId}/reviews`,
    },
  },
};

interface SavedCredentials {
  platform: string;
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

const formatDate = (date: Date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${dayName} ${day} ${month}, ${year}`;
};

export const App = () => {
  const intl = useIntl();
  const addElement = useAddElement();

  // State variables for multiple platforms
  const [platform, setPlatform] = useState("phorest");
  const [businessId, setBusinessId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [filterRating, setFilterRating] = useState(5);
  const [hasFetchedReviews, setHasFetchedReviews] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedCredentials = await window.canva.storage.get<SavedCredentials>("salon_credentials");
        if (savedCredentials) {
          setPlatform(savedCredentials.platform);
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
        await window.canva.storage.set("salon_credentials", {
          platform,
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
        await window.canva.storage.remove("salon_credentials");
      } catch {
        // Ignore storage errors
      }
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateBusinessId = (id: string) => {
    // Accept any non-empty string without spaces as a business ID
    return id.trim().length > 0 && !id.includes(' ');
  };

  const getApiConfig = () => {
    return API_CONFIGS[platform as keyof typeof API_CONFIGS] || API_CONFIGS.phorest;
  };

  const fetchBranches = async () => {
    if (!validateBusinessId(businessId)) {
      setError(intl.formatMessage({
        defaultMessage: "Please enter a valid Business ID",
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
      const apiConfig = getApiConfig();
      const endpoint = apiConfig.baseUrl + apiConfig.endpoints.branches(businessId);
      
      const response = await axios.get(endpoint, {
        auth: {
          username: apiConfig.authFormat(email),
          password,
        },
      });
      
      // Process response based on platform
      let branchData: any[] = [];
      switch (platform) {
        case 'phorest':
          branchData = response.data._embedded?.branches || [];
          break;
        case 'mindbody':
          branchData = response.data?.locations || [];
          break;
        case 'boulevard':
          branchData = response.data?.data || [];
          break;
        default:
          branchData = [];
      }
      
      // Map branch data to common format
      const mappedBranches = branchData.map((branch: any) => {
        // Handle different data structures based on platform
        if (platform === 'phorest') {
          return {
            id: branch.branchId || branch._links?.self?.href?.split('/').pop() || '',
            name: branch.name
          };
        } else if (platform === 'mindbody') {
          return {
            id: branch.id || '',
            name: branch.name
          };
        } else if (platform === 'boulevard') {
          return {
            id: branch.id || '',
            name: branch.name
          };
        }
        
        return {
          id: '',
          name: ''
        };
      });
      
      setBranches(mappedBranches);
      await saveCredentials();
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError(intl.formatMessage({
          defaultMessage: "Invalid credentials. Please check your Business ID, email, and password.",
          description: "Authentication error message"
        }));
      } else {
        setError(error.response?.data?.message || intl.formatMessage({
          defaultMessage: "Failed to fetch locations. Please try again.",
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
      const apiConfig = getApiConfig();
      const endpoint = apiConfig.baseUrl + apiConfig.endpoints.reviews(businessId, branchId);
      
      const response = await axios.get(endpoint, {
        params: {
          page: 0,
          size: 20,
        },
        auth: {
          username: apiConfig.authFormat(email),
          password,
        },
      });
      
      // Process response based on platform
      let reviewData: any[] = [];
      switch (platform) {
        case 'phorest':
          reviewData = response.data._embedded?.reviews || [];
          break;
        case 'mindbody':
          reviewData = response.data?.reviews || [];
          break;
        case 'boulevard':
          reviewData = response.data?.data || [];
          break;
        default:
          reviewData = [];
      }
      
      // Normalize review data to common format (if needed)
      const normalizedReviews = reviewData.map((review: any) => {
        // Transform data based on platform to match common format
        if (platform === 'mindbody' || platform === 'boulevard') {
          return {
            reviewId: review.id,
            clientFirstName: review.customer?.firstName || review.client?.firstName || '',
            clientLastName: review.customer?.lastName || review.client?.lastName || '',
            rating: review.rating || 5,
            reviewDate: review.date || review.createdAt || new Date().toISOString(),
            text: review.text || review.comment || '',
            staffFirstName: review.staff?.firstName || review.stylist?.firstName || '',
            staffLastName: review.staff?.lastName || review.stylist?.lastName || ''
          };
        }
        
        // Phorest already matches our format
        return review;
      });
      
      setReviews(normalizedReviews);
      setHasFetchedReviews(true);
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
    const clientName = review.clientFirstName && review.clientLastName 
      ? `${review.clientFirstName} ${review.clientLastName}`
      : "Anonymous Client";
    
    // Format the review message
    const message = review.text || "No message provided";
    
    // Create star rating with emoji stars
    const stars = "⭐".repeat(review.rating);

    // Combine all text into a single string with proper spacing
    const reviewText = [
      "CLIENT REVIEW",
      "",
      `"${message}"`,
      "",
      stars,
      "",
      clientName
    ].join("\n");

    // Add as a single text element
    addElement({
      type: "text" as const,
      children: [reviewText],
      fontSize: 72,
      textAlign: "center",
      color: "#000000"
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

  const settingsText = intl.formatMessage({
    defaultMessage: "Connection Settings",
    description: "Settings button text"
  });

  // Add transition handler
  const handleViewTransition = async (newView: boolean) => {
    setTransitioning(true);
    setTimeout(() => {
      setShowSettings(newView);
      setTransitioning(false);
    }, 1000);
  };

  const getSortedAndFilteredReviews = () => {
    return reviews
      .filter(review => filterRating === 0 || review.rating === filterRating)
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime();
        } else if (sortBy === "oldest") {
          return new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime();
        }
        return 0;
      });
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        {showSettings ? (
          // Settings View
          <div style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 1s' }}>
            <Rows spacing="2u">
              <Text>
                <FormattedMessage
                  defaultMessage="Connect your salon software account to display and insert reviews into your Canva designs."
                  description="App description"
                />
              </Text>

              {error && (
                <Alert tone="critical">
                  {error}
                </Alert>
              )}

              <Select
                value={platform}
                onChange={(value) => setPlatform(value || 'phorest')}
                options={SALON_PLATFORMS.map(p => ({ label: p.name, value: p.id }))}
                disabled={loading}
                placeholder={intl.formatMessage({
                  defaultMessage: "Select salon software",
                  description: "Platform selection placeholder"
                })}
                stretch
              />

              <TextInput
                placeholder={intl.formatMessage({
                  defaultMessage: "Enter your Business ID",
                  description: "Business ID input placeholder"
                })}
                value={businessId}
                onChange={setBusinessId}
                disabled={loading}
              />

              <TextInput
                placeholder={intl.formatMessage({
                  defaultMessage: "Enter your account email",
                  description: "Email input placeholder"
                })}
                value={email}
                onChange={setEmail}
                disabled={loading}
              />

              <TextInput
                value={password}
                onChange={setPassword}
                placeholder={intl.formatMessage({
                  defaultMessage: "Password",
                  description: "Password input placeholder"
                })}
                type="text"
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
                variant="primary"
                onClick={async () => {
                  await fetchBranches();
                  if (!error) {
                    handleViewTransition(false);
                  }
                }}
                disabled={loading || !businessId || !email || !password}
                stretch
              >
                {loading ? loadingText : fetchLocationsText}
              </Button>
            </Rows>
          </div>
        ) : (
          // Main View
          <div style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 1s' }}>
            <Rows spacing="2u">
              <Button
                variant="tertiary"
                onClick={() => handleViewTransition(true)}
                disabled={loading}
                icon="previous"
                stretch
              >
                {settingsText}
              </Button>

              <Select
                value={branchId || undefined}
                onChange={(value) => setBranchId(value || '')}
                options={branches.map((branch) => ({
                  label: branch.name,
                  value: branch.id,
                }))}
                disabled={loading}
                placeholder={intl.formatMessage({
                  defaultMessage: "Select a location",
                  description: "Location dropdown placeholder"
                })}
                stretch
              />

              <Button
                variant="primary"
                onClick={fetchReviews}
                disabled={loading || !branchId}
                stretch
              >
                {loading ? loadingText : fetchReviewsText}
              </Button>

              {reviews.length > 0 && (
                <Rows spacing="1u" align="center">
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <div style={{ flex: 1 }}>
                      <Select
                        value={sortBy}
                        onChange={(value) => setSortBy(value || 'newest')}
                        options={[
                          { label: intl.formatMessage({ defaultMessage: "Newest First", description: "Sort option" }), value: "newest" },
                          { label: intl.formatMessage({ defaultMessage: "Oldest First", description: "Sort option" }), value: "oldest" }
                        ]}
                        disabled={loading}
                        placeholder={intl.formatMessage({
                          defaultMessage: "Sort by date",
                          description: "Sort dropdown placeholder"
                        })}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Select
                        value={filterRating.toString()}
                        onChange={(value) => setFilterRating(parseInt(value || '0', 10))}
                        options={[
                          { label: intl.formatMessage({ defaultMessage: "All Ratings", description: "Rating filter option" }), value: "0" },
                          { label: "★★★★★", value: "5" },
                          { label: "★★★★", value: "4" },
                          { label: "★★★", value: "3" },
                          { label: "★★", value: "2" },
                          { label: "★", value: "1" }
                        ]}
                        disabled={loading}
                        placeholder={intl.formatMessage({
                          defaultMessage: "Filter by rating",
                          description: "Rating filter placeholder"
                        })}
                      />
                    </div>
                  </div>
                </Rows>
              )}

              {reviews.length > 0 && getSortedAndFilteredReviews().map((review) => (
                <div key={review.reviewId} className={styles.reviewCard}>
                  <Rows spacing="1u">
                    <Text>
                      <span style={{ 
                        fontSize: '16px', 
                        lineHeight: '20px', 
                        display: 'block',
                        fontWeight: 700
                      }}>
                        {review.clientFirstName && review.clientLastName 
                          ? `${review.clientFirstName} ${review.clientLastName.charAt(0)}.`
                          : intl.formatMessage({
                              defaultMessage: "Anonymous",
                              description: "Anonymous client name"
                            })}
                      </span>
                      <span style={{ 
                        fontWeight: 400,
                        fontSize: '12px',
                        lineHeight: '16px',
                        color: '#6f6f6f',
                        display: 'block'
                      }}>
                        {review.reviewDate && formatDate(new Date(review.reviewDate))}
                        {review.staffFirstName && review.staffLastName && 
                          ` with ${review.staffFirstName} ${review.staffLastName}`}
                      </span>
                      <span style={{ 
                        fontSize: '16px',
                        lineHeight: '20px',
                        color: '#f3c117',
                        display: 'block',
                        marginTop: '8px'
                      }}>
                        {"★".repeat(review.rating)}
                      </span>
                      <span style={{ 
                        fontSize: '14px',
                        lineHeight: '20px',
                        display: 'block',
                        marginTop: '8px'
                      }}>
                        {review.text || intl.formatMessage({ 
                          defaultMessage: "No message provided",
                          description: "Empty review message"
                        })}
                      </span>
                    </Text>
                    <Button
                      variant="secondary"
                      onClick={() => insertReview(review)}
                      disabled={loading}
                    >
                      {insertReviewText}
                    </Button>
                  </Rows>
                </div>
              ))}

              {reviews.length === 0 && !loading && branchId && hasFetchedReviews && (
                <Text>
                  <FormattedMessage
                    defaultMessage="No reviews found. Try fetching reviews from a different location."
                    description="Message shown when no reviews are found"
                  />
                </Text>
              )}
            </Rows>
          </div>
        )}
      </Rows>
    </div>
  );
};
