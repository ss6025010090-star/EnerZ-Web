import "../../styles/kpi-card.css";

function KPICard({
  title,
  value,
  unit,
  subtitle,
  icon,
  iconColor,
  iconBackground,
  valueColor
}) {

  return (

    <div className="kpi-card">

      <div className="kpi-left">

        <div
          className="kpi-icon"
          style={{
            background: iconBackground,
            color: iconColor
          }}
        >
          {icon}
        </div>

      </div>

      <div className="kpi-right">

        <h4>{title}</h4>

        <h2 style={{color: valueColor}}>

          {value}

          {unit && <span>{unit}</span>}

        </h2>

        <div className="kpi-badge">

          {subtitle}

        </div>

      </div>

    </div>

  );

}

export default KPICard;