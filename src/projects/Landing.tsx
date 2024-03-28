import ShimmerBar from './components/pretty/ShimmerBar.tsx';

const Landing = () => {
  return (
    <>
      <div className="main">
      {/* <h1>Welcome</h1> */}
  <h4>My name is Taylor Kaiman. I'm a software engineer currently working at Google in Payments.</h4>
  <h2>Professional Experience</h2>
  <ShimmerBar />
  <div className="section">
    <div className ="aligned-titles">
    <h3 className="experience-title">Google</h3> 
    <span className="job-title">Software Engineer 2022-Present</span></div>
    <ul className="description">
      <li>Migrated traffic from a monolith server structure to a microservice structure for millions of users</li>
      </ul>
  </div>
  <div className="section">
  <div className ="aligned-titles">
    <h3 className="experience-title">IDEXX</h3>
    <p className="job-title">Software Engineer in 2020-2022</p>
    </div>
    <ul className="description">
    <li>Developed a full suite of automated tests for a database service that handled millions of entries a day. </li>
      <li></li>
      <li></li>
      </ul>
  </div>
  <ShimmerBar />

  <h2>Technical Skills</h2>
  <div className="section">
    <p>Python, Java, Javascript, Guice, React</p>
  </div>
  <ShimmerBar />

  <h2>Education</h2>
  <div className="section">
  <p>University of Colorado at Boulder - 2014-2018</p>
    <p>Bachelors of Arts in Chemistry</p>
  </div>
      </div>
    </>
  );
};

export default Landing;
