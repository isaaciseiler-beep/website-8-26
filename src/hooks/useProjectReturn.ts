import { useLocation, useNavigate } from 'react-router-dom';

export default function useProjectReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const back = () => {
    if (location.state?.fromWork === true || location.state?.fromExplore === true) navigate(-1);
    else navigate('/work', { state: { restoreWork: true } });
  };
  return { back, label: location.state?.fromExplore === true ? 'Back to exploration' : 'Back to work' };
}
