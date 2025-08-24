import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

// World topojson
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type CountryCounts = Record<string, number>;

export function DocumentCountryMap() {
  const [counts, setCounts] = useState<CountryCounts>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("document_tracker")
          .select("country, employee_id");
        if (error) throw error;
        
        // Count unique employees per country
        const employeesByCountry: Record<string, Set<string>> = {};
        (data || []).forEach((row: any) => {
          const country = (row?.country || "").trim();
          const employeeId = row?.employee_id;
          if (!country || !employeeId) return;
          
          const key = country.toLowerCase();
          if (!employeesByCountry[key]) {
            employeesByCountry[key] = new Set();
          }
          employeesByCountry[key].add(employeeId);
        });
        
        // Convert to counts
        const map: CountryCounts = {};
        Object.entries(employeesByCountry).forEach(([country, employeeSet]) => {
          map[country] = employeeSet.size;
        });
        
        setCounts(map);
      } catch (e) {
        console.error("Failed to load employee country distribution", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const max = useMemo(() => {
    return Object.values(counts).reduce((a, b) => Math.max(a, b), 0) || 0;
  }, [counts]);

  const getFill = (value: number) => {
    if (value <= 0) return "hsl(var(--muted))";
    const ratio = value / Math.max(1, max);
    if (ratio > 0.75) return "hsl(var(--primary) / 0.55)";
    if (ratio > 0.5) return "hsl(var(--primary) / 0.4)";
    if (ratio > 0.25) return "hsl(var(--primary) / 0.28)";
    return "hsl(var(--primary) / 0.18)";
  };

  const totalEmployees = useMemo(() => {
    return Object.values(counts).reduce((a, b) => a + b, 0);
  }, [counts]);

  const topCountries = useMemo(() => {
    return Object.entries(counts)
      .map(([country, count]) => ({
        country: country.charAt(0).toUpperCase() + country.slice(1),
        count,
        percentage: totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) : "0.0"
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [counts, totalEmployees]);

  return (
    <div className="w-full space-y-6">
      {/* World Map */}
      <div className="w-full aspect-[2/1] rounded-xl border bg-card shadow-lg">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ComposableMap 
            projectionConfig={{ scale: 180 }} 
            style={{ width: "100%", height: "100%" }}
            className="rounded-xl"
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const rawName =
                    (geo.properties?.name as string) ||
                    (geo.properties?.NAME as string) ||
                    (geo.properties?.NAME_LONG as string) ||
                    "";
                  const key = rawName.toLowerCase();
                  const value = counts[key] || 0;
                  const percentage = totalEmployees > 0 ? ((value / totalEmployees) * 100).toFixed(1) : "0.0";
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: { 
                          fill: getFill(value), 
                          outline: "none",
                          stroke: "hsl(var(--border))",
                          strokeWidth: 0.5,
                          transition: "all 0.1s ease-in-out"
                        },
                        hover: { 
                          fill: "hsl(var(--primary) / 0.8)", 
                          outline: "none",
                          stroke: "hsl(var(--primary))",
                          strokeWidth: 1,
                          cursor: "pointer"
                        },
                        pressed: { 
                          fill: "hsl(var(--primary) / 0.9)", 
                          outline: "none",
                          stroke: "hsl(var(--primary))",
                          strokeWidth: 1
                        },
                      }}
                    >
                      <title>
                        {rawName}: {value} employees ({percentage}%)
                      </title>
                    </Geography>
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        )}
      </div>

      {/* Top Countries Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Top Countries by Employees</h3>
          <span className="text-sm text-muted-foreground">Total: {totalEmployees} employees</span>
        </div>
        
        <div className="grid gap-3">
          {topCountries.map((item, index) => (
            <div key={item.country} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {index + 1}
                </div>
                <span className="font-medium">{item.country}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium">{item.count} employees</div>
                  <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                </div>
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Hover countries on the map to see employee distribution. Data based on employee documents by country.
      </div>
    </div>
  );
}
